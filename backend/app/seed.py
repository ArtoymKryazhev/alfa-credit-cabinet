"""Idempotent seed: demo users (T02) + business profiles (T03). Password for all: demo."""

from __future__ import annotations

import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.passwords import hash_password
from app.mocks.registry import find_company
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.services.profile import apply_registry_fields, compute_completeness

# Demo password (all accounts): demo
_DEMO_PASSWORD = "demo"
SYSTEM_LOGIN = "system"

_SEED_USERS: list[dict[str, str | None]] = [
    {
        "login": "client1",
        "role": "client",
        "display_name": "Иванов А.А.",
        "company_inn": "7701000001",
        "company_name": 'ООО «Стабильный поток»',
    },
    {
        "login": "client2",
        "role": "client",
        "display_name": "Петрова Б.Б.",
        "company_inn": "7701000002",
        "company_name": 'ООО «Большой запрос»',
    },
    {
        "login": "client3",
        "role": "client",
        "display_name": "Сидоров В.В.",
        "company_inn": "7701000003",
        "company_name": 'ООО «Средний риск»',
    },
    {
        "login": "client4",
        "role": "client",
        "display_name": "Козлова Г.Г.",
        "company_inn": "7701000004",
        "company_name": 'ООО «Не действует»',
    },
    {
        "login": "client5",
        "role": "client",
        "display_name": "Новиков Д.Д.",
        "company_inn": "7701000005",
        "company_name": 'ООО «БКИ пауза»',
    },
    {
        "login": "manager",
        "role": "manager",
        "display_name": "Менеджер Альфа",
        "company_inn": None,
        "company_name": None,
    },
]

# contracts §8: A/C filled; B partial; D/E empty (no profile row)
_SEED_PROFILES: dict[str, dict[str, str | None]] = {
    "client1": {
        "activity_direction": "Производство продуктов питания",
        "description": (
            "Производим выпечку, продаём в собственной пекарне и поставляем в кофейни"
        ),
        "contact_person": "Иванов А.А.",
        "contact_phone": "+7 (900) 111-00-01",
        "contact_email": "client1@demo.local",
    },
    "client2": {
        "activity_direction": "Оптовые поставки",
        "description": "Оптовые поставки стройматериалов для подрядчиков",
        "contact_person": None,
        "contact_phone": None,
        "contact_email": None,
    },
    "client3": {
        "activity_direction": "Услуги для бизнеса",
        "description": "Ремонт и сервисное обслуживание промышленного оборудования",
        "contact_person": "Сидоров В.В.",
        "contact_phone": "+7 (900) 333-00-03",
        "contact_email": "client3@demo.local",
    },
}


def _seed_users(session: Session) -> None:
    password_hash = hash_password(_DEMO_PASSWORD)
    for row in _SEED_USERS:
        login = row["login"]
        assert isinstance(login, str)
        existing = session.scalar(select(User).where(User.login == login))
        if existing is not None:
            continue
        session.add(
            User(
                login=login,
                password_hash=password_hash,
                role=row["role"],  # type: ignore[arg-type]
                display_name=row["display_name"],  # type: ignore[arg-type]
                company_inn=row["company_inn"],
                company_name=row["company_name"],
            )
        )
    session.flush()

    system = session.scalar(select(User).where(User.login == SYSTEM_LOGIN))
    if system is None:
        session.add(
            User(
                login=SYSTEM_LOGIN,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                role="system",
                display_name="Система",
                company_inn=None,
                company_name=None,
            )
        )
        session.flush()


def get_system_user(session: Session) -> User:
    """Return the seeded system actor (auto decisions / offers)."""
    user = session.scalar(select(User).where(User.login == SYSTEM_LOGIN))
    if user is None:
        raise RuntimeError("System user is not seeded")
    return user


def _seed_profiles(session: Session) -> None:
    for login, fields in _SEED_PROFILES.items():
        user = session.scalar(select(User).where(User.login == login))
        if user is None or user.company_inn is None:
            continue
        existing = session.scalar(
            select(BusinessProfile).where(BusinessProfile.user_id == user.id)
        )
        if existing is not None:
            continue
        company = find_company(user.company_inn)
        if company is None:
            continue
        profile = BusinessProfile(user_id=user.id)
        apply_registry_fields(profile, company)
        profile.activity_direction = fields.get("activity_direction")
        profile.description = fields.get("description")
        profile.contact_person = fields.get("contact_person")
        profile.contact_phone = fields.get("contact_phone")
        profile.contact_email = fields.get("contact_email")
        profile.completeness = compute_completeness(
            has_registry=True,
            activity_direction=profile.activity_direction,
            description=profile.description,
            contact_person=profile.contact_person,
            contact_phone=profile.contact_phone,
            contact_email=profile.contact_email,
        )
        session.add(profile)


def run_seed(session: Session) -> None:
    """Create demo users and profiles if missing. Idempotent by login / user_id."""
    _seed_users(session)
    _seed_profiles(session)
