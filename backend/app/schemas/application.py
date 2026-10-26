"""Application request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

DEMO_RATE_ANNUAL = 0.19

DraftStep = Literal["business", "params", "review"]
ApplicationStatus = Literal[
    "draft",
    "manual_review",
    "clarification_requested",
    "offer_ready",
    "offer_accepted",
    "offer_declined",
    "declined",
]
DecisionOutcome = Literal["offer", "declined", "manual_review"]
ActorRole = Literal["client", "manager", "system"]
RiskLevel = Literal["low", "medium", "high"]
FactorValue = Literal["good", "medium", "bad", "unknown"]

PURPOSE_CODES: tuple[str, ...] = (
    "goods",
    "materials",
    "opex",
    "equipment",
    "vehicles",
    "real_estate",
    "refinancing",
    "tender_guarantee",
    "receivables",
    "business_development",
)
DRAFT_STEPS: tuple[str, ...] = ("business", "params", "review")


class OpenApplicationRequest(BaseModel):
    product_code: str = Field(min_length=1, max_length=64)


class ApplicationPatchRequest(BaseModel):
    current_step: DraftStep | None = None
    amount: int | None = None
    term_months: int | None = None
    purpose: str | None = None
    comment: str | None = None


class OfferActionRequest(BaseModel):
    offer_id: str = Field(min_length=1, max_length=36)


class ManagerDeclineRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)

    @field_validator("reason")
    @classmethod
    def reason_stripped(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Укажите причину отказа (не менее 3 символов)")
        return cleaned


class ManagerClarificationRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)

    @field_validator("question")
    @classmethod
    def question_stripped(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("Укажите вопрос (не менее 3 символов)")
        return cleaned


class ManagerReducedOfferRequest(BaseModel):
    amount: int
    term_months: int | None = None


class AttachmentResponse(BaseModel):
    id: str
    application_id: str
    filename: str
    mime: str
    size: int
    uploaded_by: int
    created_at: datetime


class ClarificationResponse(BaseModel):
    id: int
    application_id: str
    question: str
    status: Literal["open", "answered"]
    answer_text: str | None
    attachment: AttachmentResponse | None = None
    created_by: int
    created_at: datetime
    answered_at: datetime | None


class OfferResponse(BaseModel):
    id: str
    application_id: str
    amount: int
    term_months: int
    rate: float
    payment: int
    version: int
    active: bool
    created_by: int
    created_at: datetime


class DecisionResponse(BaseModel):
    id: int
    application_id: str
    outcome: DecisionOutcome
    reason_codes: list[str]
    comment: str | None
    alternative_amount: int | None = None
    created_by: int
    created_at: datetime


class RiskFactorResponse(BaseModel):
    value: FactorValue
    explanation: str
    metrics: dict[str, Any] | None = None


class RiskAssessmentResponse(BaseModel):
    id: int
    level: RiskLevel
    factors: dict[str, RiskFactorResponse]
    data_complete: bool
    created_at: datetime


class CheckRunResponse(BaseModel):
    id: int
    attempt: int
    sources: dict[str, Any]
    data_complete: bool
    created_at: datetime


class ApplicationEventResponse(BaseModel):
    id: int
    actor_user_id: int
    actor_role: ActorRole | None = None
    from_status: str | None
    to_status: str
    message: str
    created_at: datetime


class ProductResponse(BaseModel):
    code: str
    name: str
    amount_min: int
    amount_max: int
    term_min: int
    term_max: int
    rate_annual: float
    alternative_step: int
    purposes: list[str]


class ApplicationListItem(BaseModel):
    id: str
    product_code: str
    product_name: str
    status: ApplicationStatus
    current_step: DraftStep
    amount: int | None
    term_months: int | None
    purpose: str | None
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None


class ApplicationResponse(BaseModel):
    id: str
    product_code: str
    product: ProductResponse
    status: ApplicationStatus
    current_step: DraftStep
    draft_payload: dict[str, Any]
    snapshot: dict[str, Any] | None
    amount: int | None
    term_months: int | None
    purpose: str | None
    estimated_payment: int | None = None
    active_offer: OfferResponse | None = None
    decision: DecisionResponse | None = None
    checks: CheckRunResponse | None = None
    risk: RiskAssessmentResponse | None = None
    clarifications: list[ClarificationResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    events: list[ApplicationEventResponse] = Field(default_factory=list)


class ManagerApplicationListItem(BaseModel):
    id: str
    product_code: str
    product_name: str
    status: ApplicationStatus
    current_step: DraftStep
    amount: int | None
    term_months: int | None
    purpose: str | None
    company_name: str | None
    client_display_name: str
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None


class ManagerApplicationResponse(ApplicationResponse):
    client_user_id: int
    client_display_name: str
    company_name: str | None
    company_inn: str | None
