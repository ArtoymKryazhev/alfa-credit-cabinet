"""Demo BKI mock (read-only JSON)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).resolve().parent / "data" / "bki.json"


@lru_cache(maxsize=1)
def _load_rows() -> tuple[dict[str, Any], ...]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("bki.json must be a JSON array")
    return tuple(raw)


def find_bki(inn: str) -> dict[str, Any] | None:
    """Return BKI record for INN or None if missing."""
    for row in _load_rows():
        if row.get("inn") == inn:
            return dict(row)
    return None
