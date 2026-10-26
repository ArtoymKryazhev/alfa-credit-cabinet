"""Demo personalized news mock (read-only JSON)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).resolve().parent / "data" / "news.json"


@lru_cache(maxsize=1)
def _load_news() -> tuple[dict[str, Any], ...]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("news.json must be a JSON array")
    return tuple(raw)


def all_news() -> list[dict[str, Any]]:
    """All seeded news items (copy)."""
    return [dict(row) for row in _load_news()]


def general_news() -> list[dict[str, Any]]:
    """Items without industry/region tags (fallback set)."""
    result: list[dict[str, Any]] = []
    for row in _load_news():
        industries = row.get("industries") or []
        regions = row.get("regions") or []
        if not industries and not regions:
            result.append(dict(row))
    return result
