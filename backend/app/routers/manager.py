"""Manager queue and review actions (T05 + T07)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db import get_db
from app.models.application import Application, Clarification
from app.models.user import User
from app.schemas.application import (
    ManagerApplicationListItem,
    ManagerApplicationResponse,
    ManagerClarificationRequest,
    ManagerDeclineRequest,
    ManagerReducedOfferRequest,
)
from app.services.application import (
    add_event,
    create_decision,
    create_offer,
    ensure_status,
    get_application_or_404,
    manager_application_response,
    manager_list_item,
    product_or_422,
    validate_params,
)
from app.services.pipeline import run_pipeline

router = APIRouter(prefix="/manager", tags=["manager"])

_ATTENTION_STATUSES = ("manual_review", "clarification_requested")


def _manager_response(
    db: Session, row: Application
) -> ManagerApplicationResponse:
    client = db.get(User, row.client_user_id)
    assert client is not None
    return manager_application_response(db, row, client)


@router.get("/ping")
def ping(_user: User = Depends(require_roles("manager"))) -> dict[str, str]:
    return {"status": "ok"}


@router.get("/applications", response_model=list[ManagerApplicationListItem])
def list_manager_applications(
    attention: bool = Query(default=True),
    _user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> list[ManagerApplicationListItem]:
    query = select(Application, User).join(
        User, User.id == Application.client_user_id
    ).where(Application.status != "draft")
    if attention:
        query = query.where(Application.status.in_(_ATTENTION_STATUSES))
    rows = db.execute(
        query.order_by(
            Application.submitted_at.desc(),
            Application.updated_at.desc(),
            Application.created_at.desc(),
        )
    ).all()
    return [manager_list_item(app_row, client) for app_row, client in rows]


@router.get(
    "/applications/{application_id}",
    response_model=ManagerApplicationResponse,
)
def get_manager_application(
    application_id: str,
    _user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    client = db.get(User, row.client_user_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена",
        )
    return manager_application_response(db, row, client)


@router.post(
    "/applications/{application_id}/approve",
    response_model=ManagerApplicationResponse,
)
def approve_application(
    application_id: str,
    user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    ensure_status(row, ("manual_review",))

    if row.amount is None or row.term_months is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="У заявки нет суммы или срока",
        )

    from_status = row.status
    create_offer(
        db,
        application=row,
        created_by=user.id,
        amount=row.amount,
        term_months=row.term_months,
    )
    create_decision(
        db,
        application=row,
        created_by=user.id,
        outcome="offer",
        reason_codes=["manager_approve"],
        comment=None,
    )
    row.status = "offer_ready"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="offer_ready",
        message="Менеджер одобрил заявку на запрошенных условиях",
    )
    db.commit()
    db.refresh(row)
    return _manager_response(db, row)


@router.post(
    "/applications/{application_id}/decline",
    response_model=ManagerApplicationResponse,
)
def decline_application(
    application_id: str,
    body: ManagerDeclineRequest,
    user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    ensure_status(row, ("manual_review",))

    from_status = row.status
    create_decision(
        db,
        application=row,
        created_by=user.id,
        outcome="declined",
        reason_codes=["manager_decline"],
        comment=body.reason,
    )
    row.status = "declined"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="declined",
        message=f"Менеджер отклонил заявку: {body.reason}",
    )
    db.commit()
    db.refresh(row)
    return _manager_response(db, row)


@router.post(
    "/applications/{application_id}/request-clarification",
    response_model=ManagerApplicationResponse,
)
def request_clarification(
    application_id: str,
    body: ManagerClarificationRequest,
    user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    ensure_status(row, ("manual_review",))

    from_status = row.status
    clarification = Clarification(
        application_id=row.id,
        question=body.question,
        status="open",
        created_by=user.id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(clarification)
    row.status = "clarification_requested"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="clarification_requested",
        message=f"Менеджер запросил уточнение: {body.question}",
    )
    db.commit()
    db.refresh(row)
    return _manager_response(db, row)


@router.post(
    "/applications/{application_id}/offer-reduced",
    response_model=ManagerApplicationResponse,
)
def offer_reduced(
    application_id: str,
    body: ManagerReducedOfferRequest,
    user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    ensure_status(row, ("manual_review",))

    if row.amount is None or row.term_months is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="У заявки нет суммы или срока",
        )

    product = product_or_422(row.product_code)
    amount_min = int(product.get("amount_min") or 0)
    amount_step = int(product.get("alternative_step") or 50_000)
    amount = body.amount
    term_months = body.term_months if body.term_months is not None else row.term_months

    if amount >= row.amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Сниженная сумма должна быть меньше запрошенной",
        )
    if amount < amount_min:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Сумма должна быть не меньше {amount_min:,} ₽".replace(",", " "),
        )
    if amount_step > 0 and amount % amount_step != 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Сумма должна быть кратна {amount_step:,} ₽".replace(",", " ")
            ),
        )
    if term_months != row.term_months:
        validate_params(product, term_months=term_months)

    from_status = row.status
    create_offer(
        db,
        application=row,
        created_by=user.id,
        amount=amount,
        term_months=term_months,
    )
    create_decision(
        db,
        application=row,
        created_by=user.id,
        outcome="offer",
        reason_codes=["manager_reduced_offer"],
        comment=f"Предложена меньшая сумма: {amount:,} ₽".replace(",", " "),
        alternative_amount=amount,
    )
    row.status = "offer_ready"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="offer_ready",
        message=(
            f"Менеджер предложил меньшую сумму: {amount:,} ₽".replace(",", " ")
        ),
    )
    db.commit()
    db.refresh(row)
    return _manager_response(db, row)


@router.post(
    "/applications/{application_id}/recheck",
    response_model=ManagerApplicationResponse,
)
def recheck_application(
    application_id: str,
    user: User = Depends(require_roles("manager")),
    db: Session = Depends(get_db),
) -> ManagerApplicationResponse:
    row = get_application_or_404(db, application_id)
    ensure_status(row, ("manual_review",))

    if row.amount is None or row.term_months is None or not row.snapshot:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Нельзя перепроверить заявку без параметров и снимка",
        )

    run_pipeline(db, row, actor=user)
    db.commit()
    db.refresh(row)
    return _manager_response(db, row)
