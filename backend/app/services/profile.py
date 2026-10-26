"""Business profile helpers shared by API and seed."""

from __future__ import annotations

from typing import Any

from app.models.business_profile import BusinessProfile
from app.schemas.profile import ProfileResponse


def _is_blank(value: str | None) -> bool:
    return value is None or not value.strip()


def compute_completeness(
    *,
    has_registry: bool,
    activity_direction: str | None,
    description: str | None,
    contact_person: str | None,
    contact_phone: str | None,
    contact_email: str | None,
) -> str:
    if not has_registry:
        return "empty"
    step2_filled = not (
        _is_blank(activity_direction)
        or _is_blank(description)
        or _is_blank(contact_person)
        or _is_blank(contact_phone)
        or _is_blank(contact_email)
    )
    return "filled" if step2_filled else "partial"


def apply_registry_fields(profile: BusinessProfile, company: dict[str, Any]) -> None:
    profile.inn = str(company["inn"])
    profile.company_name = str(company["name"])
    profile.registration_date = str(company["registration_date"])
    profile.address = str(company["address"])
    profile.activities = str(company["activities"])
    profile.region = company.get("region")
    profile.industry = company.get("industry")
    profile.company_status = str(company.get("status") or "active")
    profile.registry_source = str(company["source"])
    profile.registry_as_of = str(company["as_of"])


def profile_to_response(row: BusinessProfile) -> ProfileResponse:
    return ProfileResponse(
        completeness=row.completeness,  # type: ignore[arg-type]
        inn=row.inn,
        company_name=row.company_name,
        registration_date=row.registration_date,
        address=row.address,
        activities=row.activities,
        region=row.region,
        industry=row.industry,
        company_status=row.company_status,
        registry_source=row.registry_source,
        registry_as_of=row.registry_as_of,
        activity_direction=row.activity_direction,
        description=row.description,
        contact_person=row.contact_person,
        contact_phone=row.contact_phone,
        contact_email=row.contact_email,
    )
