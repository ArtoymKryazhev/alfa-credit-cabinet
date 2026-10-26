"""Client application endpoints: open draft, list, get, patch, submit, offer, answer."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db import get_db
from app.models.application import Application
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.application import (
    ApplicationListItem,
    ApplicationPatchRequest,
    ApplicationResponse,
    OfferActionRequest,
    OpenApplicationRequest,
)
from app.services.application import (
    add_event,
    application_to_list_item,
    application_to_response,
    build_snapshot,
    ensure_status,
    get_active_offer,
    get_open_clarification,
    get_owned_or_404,
    merge_draft_payload,
    product_or_422,
    validate_params,
)
from app.services.attachments import save_upload
from app.services.pipeline import run_pipeline

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationResponse)
def open_application(
    body: OpenApplicationRequest,
    response: Response,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    product_or_422(body.product_code)

    existing = db.scalar(
        select(Application)
        .where(
            Application.client_user_id == user.id,
            Application.product_code == body.product_code,
            Application.status == "draft",
        )
        .order_by(Application.created_at.desc())
    )
    if existing is not None:
        response.status_code = status.HTTP_200_OK
        return application_to_response(db, existing)

    now = datetime.now(timezone.utc)
    row = Application(
        client_user_id=user.id,
        product_code=body.product_code,
        status="draft",
        current_step="business",
        draft_payload={},
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.flush()
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=None,
        to_status="draft",
        message="Черновик заявки создан",
    )
    db.commit()
    db.refresh(row)
    response.status_code = status.HTTP_201_CREATED
    return application_to_response(db, row)


@router.get("", response_model=list[ApplicationListItem])
def list_applications(
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> list[ApplicationListItem]:
    rows = db.scalars(
        select(Application)
        .where(Application.client_user_id == user.id)
        .order_by(Application.updated_at.desc(), Application.created_at.desc())
    ).all()
    return [application_to_list_item(row) for row in rows]


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    return application_to_response(db, row)


@router.patch("/{application_id}", response_model=ApplicationResponse)
def patch_application(
    application_id: str,
    body: ApplicationPatchRequest,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    if row.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Редактировать можно только черновик",
        )

    product = product_or_422(row.product_code)
    validate_params(
        product,
        amount=body.amount,
        term_months=body.term_months,
        purpose=body.purpose,
        current_step=body.current_step,
    )

    if body.current_step is not None:
        row.current_step = body.current_step

    row.draft_payload = merge_draft_payload(
        row.draft_payload,
        amount=body.amount,
        term_months=body.term_months,
        purpose=body.purpose,
        comment=body.comment,
    )

    # Keep denormalized columns in sync when params are set in draft.
    if body.amount is not None:
        row.amount = body.amount
    if body.term_months is not None:
        row.term_months = body.term_months
    if body.purpose is not None:
        row.purpose = body.purpose

    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return application_to_response(db, row)


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
def submit_application(
    application_id: str,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    if row.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Заявка уже отправлена",
        )

    profile = db.scalar(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    if profile is None or not profile.inn:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Заполните профиль бизнеса перед отправкой заявки",
        )

    payload = dict(row.draft_payload or {})
    amount = row.amount if row.amount is not None else payload.get("amount")
    term_months = (
        row.term_months if row.term_months is not None else payload.get("term_months")
    )
    purpose = row.purpose if row.purpose is not None else payload.get("purpose")

    if not isinstance(amount, int) or not isinstance(term_months, int) or not purpose:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Укажите сумму, срок и цель",
        )

    product = product_or_422(row.product_code)
    validate_params(
        product,
        amount=amount,
        term_months=term_months,
        purpose=str(purpose),
    )

    row.amount = amount
    row.term_months = term_months
    row.purpose = str(purpose)
    row.draft_payload = merge_draft_payload(
        payload,
        amount=amount,
        term_months=term_months,
        purpose=str(purpose),
    )
    row.snapshot = build_snapshot(profile)
    row.current_step = "review"
    now = datetime.now(timezone.utc)
    row.submitted_at = now
    row.updated_at = now

    run_pipeline(db, row, actor=user)
    db.commit()
    db.refresh(row)
    return application_to_response(db, row)


def _require_active_offer(
    db: Session,
    row: Application,
    offer_id: str,
) -> None:
    ensure_status(row, ("offer_ready",))
    active = get_active_offer(db, row.id)
    if active is None or active.id != offer_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Предложение неактуально",
        )


@router.post("/{application_id}/answer", response_model=ApplicationResponse)
async def answer_clarification(
    application_id: str,
    answer_text: str = Form(...),
    file: UploadFile | None = File(None),
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    ensure_status(row, ("clarification_requested",))

    cleaned = answer_text.strip()
    if len(cleaned) < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Укажите текст ответа",
        )

    clarification = get_open_clarification(db, row.id)
    if clarification is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Нет открытого запроса на уточнение",
        )

    attachment_id = None
    if file is not None and file.filename:
        attachment = save_upload(
            db,
            application_id=row.id,
            uploaded_by=user.id,
            upload=file,
        )
        attachment_id = attachment.id

    now = datetime.now(timezone.utc)
    from_status = row.status
    clarification.answer_text = cleaned
    clarification.attachment_id = attachment_id
    clarification.status = "answered"
    clarification.answered_at = now

    row.status = "manual_review"
    row.updated_at = now
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="manual_review",
        message="Клиент ответил на уточнение",
    )
    db.commit()
    db.refresh(row)
    return application_to_response(db, row)


@router.post(
    "/{application_id}/offer/accept",
    response_model=ApplicationResponse,
)
def accept_offer(
    application_id: str,
    body: OfferActionRequest,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    _require_active_offer(db, row, body.offer_id)

    from_status = row.status
    row.status = "offer_accepted"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="offer_accepted",
        message="Клиент принял предложение",
    )
    db.commit()
    db.refresh(row)
    return application_to_response(db, row)


@router.post(
    "/{application_id}/offer/decline",
    response_model=ApplicationResponse,
)
def decline_offer(
    application_id: str,
    body: OfferActionRequest,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    row = get_owned_or_404(db, application_id, user.id)
    _require_active_offer(db, row, body.offer_id)

    from_status = row.status
    row.status = "offer_declined"
    row.updated_at = datetime.now(timezone.utc)
    add_event(
        db,
        application=row,
        actor_user_id=user.id,
        from_status=from_status,
        to_status="offer_declined",
        message="Клиент отклонил предложение",
    )
    db.commit()
    db.refresh(row)
    return application_to_response(db, row)
