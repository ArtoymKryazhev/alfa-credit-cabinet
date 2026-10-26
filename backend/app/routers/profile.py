"""Business profile endpoints: GET/PUT profile, registry lookup."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db import get_db
from app.mocks.registry import find_company
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.profile import (
    ACTIVITY_DIRECTIONS,
    ProfileResponse,
    ProfileUpdateRequest,
    RegistryCompanyResponse,
    RegistryLookupRequest,
)
from app.services.profile import (
    apply_registry_fields,
    compute_completeness,
    profile_to_response,
)

router = APIRouter(prefix="/profile", tags=["profile"])

_EMPTY_PROFILE = ProfileResponse(completeness="empty")


def _validate_inn_format(inn: str) -> str:
    cleaned = inn.strip()
    if not cleaned.isdigit() or len(cleaned) not in (10, 12):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ИНН должен содержать 10 или 12 цифр",
        )
    return cleaned


def _resolve_registry_for_user(inn: str, user: User) -> dict[str, Any]:
    """Validate INN format, registry presence, and ownership. Returns registry row."""
    cleaned = _validate_inn_format(inn)
    company = find_company(cleaned)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ИНН нет в демо-реестре",
        )
    if user.company_inn is None or cleaned != user.company_inn:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ИНН не относится к вашей компании",
        )
    return company


@router.get("", response_model=ProfileResponse)
def get_profile(
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    row = db.scalar(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    if row is None:
        return _EMPTY_PROFILE
    return profile_to_response(row)


@router.post("/registry-lookup", response_model=RegistryCompanyResponse)
def registry_lookup(
    body: RegistryLookupRequest,
    user: User = Depends(require_roles("client")),
) -> RegistryCompanyResponse:
    company = _resolve_registry_for_user(body.inn, user)
    return RegistryCompanyResponse(
        inn=str(company["inn"]),
        name=str(company["name"]),
        ogrn=company.get("ogrn"),
        registration_date=str(company["registration_date"]),
        address=str(company["address"]),
        activities=str(company["activities"]),
        region=company.get("region"),
        industry=company.get("industry"),
        status=str(company.get("status") or "active"),
        source=str(company["source"]),
        as_of=str(company["as_of"]),
    )


@router.put("", response_model=ProfileResponse)
def put_profile(
    body: ProfileUpdateRequest,
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    company = _resolve_registry_for_user(body.inn, user)

    if body.activity_direction is not None and body.activity_direction != "":
        if body.activity_direction not in ACTIVITY_DIRECTIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Недопустимое направление деятельности",
            )

    row = db.scalar(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    if row is None:
        row = BusinessProfile(user_id=user.id)
        db.add(row)

    apply_registry_fields(row, company)

    if body.activity_direction is not None:
        row.activity_direction = body.activity_direction.strip() or None
    if body.description is not None:
        row.description = body.description.strip() or None
    if body.contact_person is not None:
        row.contact_person = body.contact_person.strip() or None
    if body.contact_phone is not None:
        row.contact_phone = body.contact_phone.strip() or None
    if body.contact_email is not None:
        row.contact_email = body.contact_email.strip() or None

    row.completeness = compute_completeness(
        has_registry=True,
        activity_direction=row.activity_direction,
        description=row.description,
        contact_person=row.contact_person,
        contact_phone=row.contact_phone,
        contact_email=row.contact_email,
    )

    db.commit()
    db.refresh(row)
    return profile_to_response(row)
