"""Demo company registry mock (read-only JSON)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).resolve().parent / "data" / "registry.json"


@lru_cache(maxsize=1)
def _load_companies() -> tuple[dict[str, Any], ...]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("registry.json must be a JSON array")
    return tuple(raw)


def find_company(inn: str) -> dict[str, Any] | None:
    """Return registry record for INN or None if missing."""
    for row in _load_companies():
        if row.get("inn") == inn:
            return dict(row)
    return None


def all_companies() -> list[dict[str, Any]]:
    """All seeded registry companies (copy)."""
    return [dict(row) for row in _load_companies()]
