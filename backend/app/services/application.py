"""Application helpers: ownership, events, snapshot, annuity, offers."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.mocks.products import get_product
from app.models.application import (
    Application,
    ApplicationEvent,
    Attachment,
    CheckRun,
    Clarification,
    Decision,
    Offer,
    RiskAssessment,
)
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.application import (
    DEMO_RATE_ANNUAL,
    DRAFT_STEPS,
    ApplicationEventResponse,
    ApplicationListItem,
    ApplicationResponse,
    AttachmentResponse,
    CheckRunResponse,
    ClarificationResponse,
    DecisionResponse,
    ManagerApplicationListItem,
    ManagerApplicationResponse,
    OfferResponse,
    ProductResponse,
    RiskAssessmentResponse,
    RiskFactorResponse,
)
from app.services.profile import profile_to_response


def annuity_payment(
    amount: int,
    term_months: int,
    annual_rate: float = DEMO_RATE_ANNUAL,
) -> int:
    """Monthly annuity payment, rounded to nearest ruble."""
    if amount <= 0 or term_months <= 0:
        return 0
    monthly_rate = annual_rate / 12
    if monthly_rate == 0:
        return int(round(amount / term_months))
    factor = (1 + monthly_rate) ** term_months
    payment = amount * monthly_rate * factor / (factor - 1)
    return int(round(payment))


def product_or_422(code: str) -> dict[str, Any]:
    product = get_product(code)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Продукт в демо недоступен",
        )
    return product


def product_to_response(product: dict[str, Any]) -> ProductResponse:
    purposes = product.get("purposes") or []
    return ProductResponse(
        code=str(product.get("code") or ""),
        name=str(product.get("name") or product.get("code") or ""),
        amount_min=int(product.get("amount_min") or 0),
        amount_max=int(product.get("amount_max") or 0),
        term_min=int(product.get("term_min") or 0),
        term_max=int(product.get("term_max") or 0),
        rate_annual=float(product.get("rate_annual") or DEMO_RATE_ANNUAL),
        alternative_step=int(product.get("alternative_step") or 50_000),
        purposes=[str(item) for item in purposes],
    )


def product_name_for(code: str) -> str:
    product = get_product(code)
    if product is None:
        return code
    return str(product.get("name") or code)


def get_owned_or_404(
    db: Session,
    application_id: str,
    user_id: int,
) -> Application:
    row = db.get(Application, application_id)
    if row is None or row.client_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена",
        )
    return row


def get_application_or_404(db: Session, application_id: str) -> Application:
    row = db.get(Application, application_id)
    if row is None or row.status == "draft":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена",
        )
    return row


def ensure_status(row: Application, allowed: Iterable[str]) -> None:
    if row.status not in set(allowed):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Недопустимый переход статуса",
        )


def add_event(
    db: Session,
    *,
    application: Application,
    actor_user_id: int,
    from_status: str | None,
    to_status: str,
    message: str,
) -> ApplicationEvent:
    event = ApplicationEvent(
        application_id=application.id,
        actor_user_id=actor_user_id,
        from_status=from_status,
        to_status=to_status,
        message=message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    return event


def build_snapshot(profile: BusinessProfile) -> dict[str, Any]:
    return profile_to_response(profile).model_dump()


def validate_params(
    product: dict[str, Any],
    *,
    amount: int | None = None,
    term_months: int | None = None,
    purpose: str | None = None,
    current_step: str | None = None,
) -> None:
    if current_step is not None and current_step not in DRAFT_STEPS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Недопустимый шаг черновика",
        )

    amount_min = int(product.get("amount_min") or 0)
    amount_max = int(product.get("amount_max") or 0)
    term_min = int(product.get("term_min") or 0)
    term_max = int(product.get("term_max") or 0)
    allowed_purposes = {str(item) for item in (product.get("purposes") or [])}

    if amount is not None and not (amount_min <= amount <= amount_max):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Сумма должна быть от {amount_min:,} до {amount_max:,} ₽"
            ).replace(",", " "),
        )

    if term_months is not None and not (term_min <= term_months <= term_max):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Срок должен быть от {term_min} до {term_max} месяцев",
        )

    if purpose is not None and purpose not in allowed_purposes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Недопустимое назначение кредита",
        )


def get_active_offer(db: Session, application_id: str) -> Offer | None:
    return db.scalar(
        select(Offer)
        .where(Offer.application_id == application_id, Offer.active.is_(True))
        .order_by(Offer.version.desc(), Offer.created_at.desc())
    )


def get_latest_decision(db: Session, application_id: str) -> Decision | None:
    return db.scalar(
        select(Decision)
        .where(Decision.application_id == application_id)
        .order_by(Decision.created_at.desc(), Decision.id.desc())
    )


def create_offer(
    db: Session,
    *,
    application: Application,
    created_by: int,
    amount: int,
    term_months: int,
    rate: float | None = None,
) -> Offer:
    if rate is None:
        product = get_product(application.product_code) or {}
        rate = float(product.get("rate_annual") or DEMO_RATE_ANNUAL)

    existing = list(
        db.scalars(
            select(Offer)
            .where(Offer.application_id == application.id)
            .order_by(Offer.version.desc())
        ).all()
    )
    next_version = (existing[0].version + 1) if existing else 1
    for offer in existing:
        if offer.active:
            offer.active = False

    offer = Offer(
        application_id=application.id,
        amount=amount,
        term_months=term_months,
        rate=rate,
        payment=annuity_payment(amount, term_months, rate),
        version=next_version,
        active=True,
        created_by=created_by,
        created_at=datetime.now(timezone.utc),
    )
    db.add(offer)
    db.flush()
    return offer


def create_decision(
    db: Session,
    *,
    application: Application,
    created_by: int,
    outcome: str,
    reason_codes: list[str],
    comment: str | None = None,
    alternative_amount: int | None = None,
) -> Decision:
    decision = Decision(
        application_id=application.id,
        outcome=outcome,
        reason_codes=reason_codes,
        comment=comment,
        alternative_amount=alternative_amount,
        created_by=created_by,
        created_at=datetime.now(timezone.utc),
    )
    db.add(decision)
    db.flush()
    return decision


def get_latest_check_run(db: Session, application_id: str) -> CheckRun | None:
    return db.scalar(
        select(CheckRun)
        .where(CheckRun.application_id == application_id)
        .order_by(CheckRun.attempt.desc(), CheckRun.id.desc())
    )


def get_latest_risk(db: Session, application_id: str) -> RiskAssessment | None:
    return db.scalar(
        select(RiskAssessment)
        .where(RiskAssessment.application_id == application_id)
        .order_by(RiskAssessment.created_at.desc(), RiskAssessment.id.desc())
    )


def count_check_runs(db: Session, application_id: str) -> int:
    rows = list(
        db.scalars(
            select(CheckRun).where(CheckRun.application_id == application_id)
        ).all()
    )
    return len(rows)


def get_open_clarification(
    db: Session, application_id: str
) -> Clarification | None:
    return db.scalar(
        select(Clarification)
        .where(
            Clarification.application_id == application_id,
            Clarification.status == "open",
        )
        .order_by(Clarification.created_at.desc(), Clarification.id.desc())
    )


def list_clarifications(
    db: Session, application_id: str
) -> list[Clarification]:
    return list(
        db.scalars(
            select(Clarification)
            .where(Clarification.application_id == application_id)
            .order_by(Clarification.created_at.asc(), Clarification.id.asc())
        ).all()
    )


def _attachment_to_response(attachment: Attachment) -> AttachmentResponse:
    return AttachmentResponse(
        id=attachment.id,
        application_id=attachment.application_id,
        filename=attachment.filename,
        mime=attachment.mime,
        size=attachment.size,
        uploaded_by=attachment.uploaded_by,
        created_at=attachment.created_at,
    )


def _clarification_to_response(
    db: Session, clarification: Clarification
) -> ClarificationResponse:
    attachment = None
    if clarification.attachment_id:
        row = db.get(Attachment, clarification.attachment_id)
        if row is not None:
            attachment = _attachment_to_response(row)
    return ClarificationResponse(
        id=clarification.id,
        application_id=clarification.application_id,
        question=clarification.question,
        status=clarification.status,  # type: ignore[arg-type]
        answer_text=clarification.answer_text,
        attachment=attachment,
        created_by=clarification.created_by,
        created_at=clarification.created_at,
        answered_at=clarification.answered_at,
    )


def _events_for(db: Session, application_id: str) -> list[ApplicationEvent]:
    return list(
        db.scalars(
            select(ApplicationEvent)
            .where(ApplicationEvent.application_id == application_id)
            .order_by(ApplicationEvent.created_at.asc(), ApplicationEvent.id.asc())
        ).all()
    )


def _actor_roles(db: Session, events: list[ApplicationEvent]) -> dict[int, str]:
    user_ids = {event.actor_user_id for event in events}
    if not user_ids:
        return {}
    users = db.scalars(select(User).where(User.id.in_(user_ids))).all()
    return {user.id: user.role for user in users}


def _offer_to_response(offer: Offer) -> OfferResponse:
    return OfferResponse(
        id=offer.id,
        application_id=offer.application_id,
        amount=offer.amount,
        term_months=offer.term_months,
        rate=offer.rate,
        payment=offer.payment,
        version=offer.version,
        active=offer.active,
        created_by=offer.created_by,
        created_at=offer.created_at,
    )


def _decision_to_response(decision: Decision) -> DecisionResponse:
    codes = decision.reason_codes or []
    return DecisionResponse(
        id=decision.id,
        application_id=decision.application_id,
        outcome=decision.outcome,  # type: ignore[arg-type]
        reason_codes=[str(code) for code in codes],
        comment=decision.comment,
        alternative_amount=decision.alternative_amount,
        created_by=decision.created_by,
        created_at=decision.created_at,
    )


def _check_run_to_response(check_run: CheckRun) -> CheckRunResponse:
    return CheckRunResponse(
        id=check_run.id,
        attempt=check_run.attempt,
        sources=dict(check_run.sources or {}),
        data_complete=check_run.data_complete,
        created_at=check_run.created_at,
    )


def _risk_to_response(risk: RiskAssessment) -> RiskAssessmentResponse:
    raw_factors = risk.factors or {}
    factors: dict[str, RiskFactorResponse] = {}
    for key, value in raw_factors.items():
        if not isinstance(value, dict):
            continue
        factors[str(key)] = RiskFactorResponse(
            value=value.get("value", "unknown"),  # type: ignore[arg-type]
            explanation=str(value.get("explanation") or ""),
            metrics=value.get("metrics"),
        )
    return RiskAssessmentResponse(
        id=risk.id,
        level=risk.level,  # type: ignore[arg-type]
        factors=factors,
        data_complete=risk.data_complete,
        created_at=risk.created_at,
    )


def application_to_list_item(row: Application) -> ApplicationListItem:
    return ApplicationListItem(
        id=row.id,
        product_code=row.product_code,
        product_name=product_name_for(row.product_code),
        status=row.status,  # type: ignore[arg-type]
        current_step=row.current_step,  # type: ignore[arg-type]
        amount=row.amount,
        term_months=row.term_months,
        purpose=row.purpose,
        created_at=row.created_at,
        updated_at=row.updated_at,
        submitted_at=row.submitted_at,
    )


def application_to_response(
    db: Session,
    row: Application,
) -> ApplicationResponse:
    product = product_or_422(row.product_code)
    product_response = product_to_response(product)
    payload = dict(row.draft_payload or {})
    amount = row.amount if row.amount is not None else payload.get("amount")
    term = row.term_months if row.term_months is not None else payload.get("term_months")
    estimated: int | None = None
    if isinstance(amount, int) and isinstance(term, int) and amount > 0 and term > 0:
        estimated = annuity_payment(amount, term, product_response.rate_annual)

    events = _events_for(db, row.id)
    roles = _actor_roles(db, events)
    event_responses = [
        ApplicationEventResponse(
            id=event.id,
            actor_user_id=event.actor_user_id,
            actor_role=roles.get(event.actor_user_id),  # type: ignore[arg-type]
            from_status=event.from_status,
            to_status=event.to_status,
            message=event.message,
            created_at=event.created_at,
        )
        for event in events
    ]

    active_offer = get_active_offer(db, row.id)
    decision = get_latest_decision(db, row.id)
    check_run = get_latest_check_run(db, row.id)
    risk = get_latest_risk(db, row.id)
    clarifications = [
        _clarification_to_response(db, item)
        for item in list_clarifications(db, row.id)
    ]

    return ApplicationResponse(
        id=row.id,
        product_code=row.product_code,
        product=product_response,
        status=row.status,  # type: ignore[arg-type]
        current_step=row.current_step,  # type: ignore[arg-type]
        draft_payload=payload,
        snapshot=row.snapshot,
        amount=row.amount,
        term_months=row.term_months,
        purpose=row.purpose,
        estimated_payment=estimated,
        active_offer=_offer_to_response(active_offer) if active_offer else None,
        decision=_decision_to_response(decision) if decision else None,
        checks=_check_run_to_response(check_run) if check_run else None,
        risk=_risk_to_response(risk) if risk else None,
        clarifications=clarifications,
        created_at=row.created_at,
        updated_at=row.updated_at,
        submitted_at=row.submitted_at,
        events=event_responses,
    )


def manager_list_item(
    row: Application,
    client: User,
) -> ManagerApplicationListItem:
    company_name = None
    if isinstance(row.snapshot, dict):
        company_name = row.snapshot.get("company_name") or row.snapshot.get("inn")
    if not company_name:
        company_name = client.company_name

    return ManagerApplicationListItem(
        id=row.id,
        product_code=row.product_code,
        product_name=product_name_for(row.product_code),
        status=row.status,  # type: ignore[arg-type]
        current_step=row.current_step,  # type: ignore[arg-type]
        amount=row.amount,
        term_months=row.term_months,
        purpose=row.purpose,
        company_name=company_name,
        client_display_name=client.display_name,
        created_at=row.created_at,
        updated_at=row.updated_at,
        submitted_at=row.submitted_at,
    )


def manager_application_response(
    db: Session,
    row: Application,
    client: User,
) -> ManagerApplicationResponse:
    base = application_to_response(db, row)
    company_name = None
    company_inn = client.company_inn
    if isinstance(row.snapshot, dict):
        company_name = row.snapshot.get("company_name")
        company_inn = row.snapshot.get("inn") or company_inn
    if not company_name:
        company_name = client.company_name

    return ManagerApplicationResponse(
        **base.model_dump(),
        client_user_id=row.client_user_id,
        client_display_name=client.display_name,
        company_name=company_name,
        company_inn=company_inn,
    )


def merge_draft_payload(
    existing: dict[str, Any] | None,
    *,
    amount: int | None = None,
    term_months: int | None = None,
    purpose: str | None = None,
    comment: str | None = None,
) -> dict[str, Any]:
    payload = dict(existing or {})
    if amount is not None:
        payload["amount"] = amount
    if term_months is not None:
        payload["term_months"] = term_months
    if purpose is not None:
        payload["purpose"] = purpose
    if comment is not None:
        payload["comment"] = comment
    return payload
