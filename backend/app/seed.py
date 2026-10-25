"""Idempotent seed: demo users (T02). Password for all: demo."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.passwords import hash_password
from app.models.user import User

# Demo password (all accounts): demo
_DEMO_PASSWORD = "demo"

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


def run_seed(session: Session) -> None:
    """Create demo users if missing. Idempotent by login."""
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
