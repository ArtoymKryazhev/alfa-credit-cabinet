"""Business profile ORM model (one per client user)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_business_profiles_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    inn: Mapped[str] = mapped_column(String(12))
    company_name: Mapped[str] = mapped_column(String(255))
    registration_date: Mapped[str] = mapped_column(String(32))
    address: Mapped[str] = mapped_column(String(512))
    activities: Mapped[str] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(String(128), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(128), nullable=True)
    company_status: Mapped[str] = mapped_column(String(32), default="active")
    registry_source: Mapped[str] = mapped_column(String(128))
    registry_as_of: Mapped[str] = mapped_column(String(32))

    activity_direction: Mapped[str | None] = mapped_column(String(128), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(128), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(128), nullable=True)

    completeness: Mapped[str] = mapped_column(String(16), default="partial")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
