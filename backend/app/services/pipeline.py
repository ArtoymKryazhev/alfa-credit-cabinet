"""Submit / recheck pipeline: checks → risk → decision → status/offer."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.application import Application, CheckRun, RiskAssessment
from app.models.user import User
from app.seed import get_system_user
from app.services.application import (
    add_event,
    count_check_runs,
    create_decision,
    create_offer,
)
from app.services.checks import run_checks
from app.services.decision import decide
from app.services.risk import assess_risk


def _event_message(decision_result: dict) -> str:
    outcome = decision_result.get("outcome")
    codes = decision_result.get("reason_codes") or []
    comment = decision_result.get("comment") or ""
    if outcome == "offer":
        return "Автоматическое предложение сформировано"
    if outcome == "declined":
        return comment or f"Автоматический отказ: {', '.join(codes)}"
    alt = decision_result.get("alternative_amount")
    if alt is not None:
        return (
            f"Заявка направлена менеджеру. Расчётная альтернатива: "
            f"{alt:,} ₽".replace(",", " ")
        )
    if "source_unavailable" in codes:
        return "Источник данных недоступен — заявка у менеджера"
    if "data_incomplete" in codes:
        return "Недостаточно данных — заявка у менеджера"
    if "risk_medium" in codes or "risk_high" in codes:
        return comment or "Риск требует ручной проверки — заявка у менеджера"
    return comment or "Заявка направлена на рассмотрение менеджера"


def run_pipeline(
    db: Session,
    application: Application,
    *,
    actor: User | None = None,
) -> Application:
    """
    Run enrichment → risk → decision for a submitted application.

    Caller must set snapshot / amount / term before invoke.
    Persists check_runs, risk_assessments, decisions; may create offer.
    Does not commit — caller commits.
    """
    if application.amount is None or application.term_months is None:
        raise ValueError("Application amount and term_months are required")

    snapshot = application.snapshot or {}
    inn = str(snapshot.get("inn") or "")
    if not inn:
        raise ValueError("Application snapshot must include inn")

    system = get_system_user(db)

    attempt = count_check_runs(db, application.id) + 1
    check_result = run_checks(
        inn=inn,
        product_code=application.product_code,
        attempt=attempt,
    )

    check_run = CheckRun(
        application_id=application.id,
        attempt=attempt,
        sources=check_result["sources"],
        data_complete=bool(check_result["data_complete"]),
        created_at=datetime.now(timezone.utc),
    )
    db.add(check_run)
    db.flush()

    product_data = (
        (check_result["sources"].get("product") or {}).get("data") or {}
    )
    annual_rate = float(product_data.get("rate_annual") or 0.19)

    risk_result = assess_risk(
        sources=check_result["sources"],
        amount=application.amount,
        term_months=application.term_months,
        annual_rate=annual_rate,
    )

    risk_row = RiskAssessment(
        application_id=application.id,
        check_run_id=check_run.id,
        level=risk_result["level"],
        factors=risk_result["factors"],
        data_complete=bool(risk_result["data_complete"]),
        created_at=datetime.now(timezone.utc),
    )
    db.add(risk_row)
    db.flush()

    decision_result = decide(
        sources=check_result["sources"],
        risk=risk_result,
        amount=application.amount,
        term_months=application.term_months,
    )

    from_status = application.status
    to_status = str(decision_result["status"])

    create_decision(
        db,
        application=application,
        created_by=system.id,
        outcome=str(decision_result["outcome"]),
        reason_codes=list(decision_result.get("reason_codes") or []),
        comment=decision_result.get("comment"),
        alternative_amount=decision_result.get("alternative_amount"),
    )

    if decision_result["outcome"] == "offer":
        create_offer(
            db,
            application=application,
            created_by=system.id,
            amount=application.amount,
            term_months=application.term_months,
            rate=annual_rate,
        )

    application.status = to_status
    application.updated_at = datetime.now(timezone.utc)

    # Use explicit actor when provided (submit client / recheck manager);
    # otherwise attribute the pipeline event to the system user.
    event_actor_id = actor.id if actor is not None else system.id
    add_event(
        db,
        application=application,
        actor_user_id=event_actor_id,
        from_status=from_status,
        to_status=to_status,
        message=_event_message(decision_result),
    )

    db.flush()
    return application
