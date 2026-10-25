"""Application settings loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


def _default_data_dir() -> Path:
    return Path(__file__).resolve().parent.parent / ".data"


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    database_url: str
    uploads_dir: Path
    cors_origins: list[str]
    session_secret: str


def _parse_cors_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    data_dir = Path(os.getenv("DATA_DIR", str(_default_data_dir()))).resolve()
    database_url = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(data_dir / 'app.db').as_posix()}",
    )
    uploads_dir = Path(
        os.getenv("UPLOADS_DIR", str(data_dir / "uploads"))
    ).resolve()
    cors_origins = _parse_cors_origins(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080",
        )
    )
    session_secret = os.getenv("SESSION_SECRET", "dev-session-secret-change-me")
    return Settings(
        data_dir=data_dir,
        database_url=database_url,
        uploads_dir=uploads_dir,
        cors_origins=cors_origins,
        session_secret=session_secret,
    )
