"""SQLAlchemy engine, session factory, and declarative base."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

connect_args: dict[str, object] = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=Session,
)


class Base(DeclarativeBase):
    """Shared declarative base for ORM models."""


def ensure_columns(bind: Engine | None = None) -> None:
    """Idempotent ALTER for columns added after first create_all (SQLite)."""
    target = bind or engine
    if not str(target.url).startswith("sqlite"):
        return
    with target.begin() as conn:
        rows = conn.execute(text("PRAGMA table_info(decisions)")).fetchall()
        if not rows:
            return
        columns = {row[1] for row in rows}
        if "alternative_amount" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE decisions ADD COLUMN alternative_amount INTEGER"
                )
            )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
