"""Pytest fixtures. Env must be set before importing the app."""

from __future__ import annotations

import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    data_dir = tmp_path / "data"
    monkeypatch.setenv("DATA_DIR", str(data_dir))
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{(data_dir / 'app.db').as_posix()}")
    monkeypatch.setenv("UPLOADS_DIR", str(data_dir / "uploads"))
    monkeypatch.setenv("CORS_ORIGINS", "http://testserver")
    monkeypatch.setenv("SESSION_SECRET", "test-secret")

    for name in list(sys.modules):
        if name == "app" or name.startswith("app."):
            del sys.modules[name]

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
