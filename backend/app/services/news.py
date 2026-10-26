"""Select personalized demo news by industry and region tags."""

from __future__ import annotations

from typing import Any

from app.mocks.news import all_news, general_news


def select_news(
    industry: str | None,
    region: str | None,
    *,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """
    Score items: industry match +2, region match +1.
    Prefer higher score, then newer published_at.
    Fill remaining slots with general (untagged) items.
    """
    if limit <= 0:
        return []

    industry_key = (industry or "").strip() or None
    region_key = (region or "").strip() or None

    if industry_key is None and region_key is None:
        return general_news()[:limit]

    scored: list[tuple[int, str, dict[str, Any]]] = []
    for item in all_news():
        industries = item.get("industries") or []
        regions = item.get("regions") or []
        score = 0
        if industry_key and industry_key in industries:
            score += 2
        if region_key and region_key in regions:
            score += 1
        if score > 0:
            published = str(item.get("published_at") or "")
            scored.append((score, published, dict(item)))

    scored.sort(key=lambda row: (row[0], row[1]), reverse=True)
    selected: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for _score, _published, item in scored:
        item_id = str(item.get("id") or "")
        if item_id in seen_ids:
            continue
        selected.append(item)
        seen_ids.add(item_id)
        if len(selected) >= limit:
            return selected

    for item in general_news():
        item_id = str(item.get("id") or "")
        if item_id in seen_ids:
            continue
        selected.append(dict(item))
        seen_ids.add(item_id)
        if len(selected) >= limit:
            break

    return selected
