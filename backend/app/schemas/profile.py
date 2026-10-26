"""Business profile request/response schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ACTIVITY_DIRECTIONS = (
    "Производство продуктов питания",
    "Розничная торговля",
    "Оптовые поставки",
    "Услуги для бизнеса",
    "IT и цифровые сервисы",
)

Completeness = Literal["empty", "partial", "filled"]


class RegistryLookupRequest(BaseModel):
    inn: str = Field(min_length=1, max_length=12)


class RegistryCompanyResponse(BaseModel):
    inn: str
    name: str
    ogrn: str | None = None
    registration_date: str
    address: str
    activities: str
    region: str | None = None
    industry: str | None = None
    status: str
    source: str
    as_of: str


class ProfileUpdateRequest(BaseModel):
    inn: str = Field(min_length=1, max_length=12)
    activity_direction: str | None = None
    description: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None


class ProfileResponse(BaseModel):
    completeness: Completeness
    inn: str | None = None
    company_name: str | None = None
    registration_date: str | None = None
    address: str | None = None
    activities: str | None = None
    region: str | None = None
    industry: str | None = None
    company_status: str | None = None
    registry_source: str | None = None
    registry_as_of: str | None = None
    activity_direction: str | None = None
    description: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
