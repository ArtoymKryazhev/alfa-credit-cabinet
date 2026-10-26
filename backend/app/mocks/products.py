"""Demo product catalog mock (read-only JSON)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).resolve().parent / "data" / "products.json"


@lru_cache(maxsize=1)
def _load_products() -> dict[str, Any]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("products.json must be a JSON object")
    return raw


def get_product(code: str) -> dict[str, Any] | None:
    """Return product rules for code or None if missing."""
    row = _load_products().get(code)
    if row is None:
        return None
    return dict(row)


def all_products() -> list[dict[str, Any]]:
    """All catalog products (copies)."""
    return [dict(row) for row in _load_products().values()]
