"""Application, event, offer and decision ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


def _new_application_id() -> str:
    return str(uuid.uuid4())


def _new_offer_id() -> str:
    return str(uuid.uuid4())


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_new_application_id
    )
    client_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_code: Mapped[str] = mapped_column(String(64), default="working_capital")
    status: Mapped[str] = mapped_column(String(32), default="draft", index=True)
    current_step: Mapped[str] = mapped_column(String(32), default="business")
    draft_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    term_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    actor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32))
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_offer_id)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    amount: Mapped[int] = mapped_column(Integer)
    term_months: Mapped[int] = mapped_column(Integer)
    rate: Mapped[float] = mapped_column(Float)
    payment: Mapped[int] = mapped_column(Integer)
    version: Mapped[int] = mapped_column(Integer, default=1)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    outcome: Mapped[str] = mapped_column(String(32))  # offer | declined | manual_review
    reason_codes: Mapped[list[Any]] = mapped_column(JSON, default=list)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    alternative_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class CheckRun(Base):
    __tablename__ = "check_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    attempt: Mapped[int] = mapped_column(Integer, default=1)
    sources: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    data_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    check_run_id: Mapped[int] = mapped_column(
        ForeignKey("check_runs.id"), index=True
    )
    level: Mapped[str] = mapped_column(String(16))  # low | medium | high
    factors: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    data_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


def _new_attachment_id() -> str:
    return str(uuid.uuid4())


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_new_attachment_id
    )
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    filename: Mapped[str] = mapped_column(String(255))
    mime: Mapped[str] = mapped_column(String(128))
    size: Mapped[int] = mapped_column(Integer)
    path: Mapped[str] = mapped_column(String(512))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Clarification(Base):
    __tablename__ = "clarifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id"), index=True
    )
    question: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="open")  # open | answered
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("attachments.id"), nullable=True
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    answered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
