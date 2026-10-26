"""Personalized news feed for the client showcase."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db import get_db
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.news import NewsFeedResponse, NewsItemResponse
from app.services.news import select_news

router = APIRouter(prefix="/news", tags=["news"])


def _to_item(row: dict) -> NewsItemResponse:
    return NewsItemResponse(
        id=str(row["id"]),
        title=str(row["title"]),
        summary=str(row["summary"]),
        published_at=str(row["published_at"]),
        industries=list(row.get("industries") or []),
        regions=list(row.get("regions") or []),
        source=str(row["source"]),
        as_of=str(row["as_of"]),
    )


@router.get("", response_model=NewsFeedResponse)
def get_news(
    user: User = Depends(require_roles("client")),
    db: Session = Depends(get_db),
) -> NewsFeedResponse:
    profile = db.scalar(
        select(BusinessProfile).where(BusinessProfile.user_id == user.id)
    )
    if profile is None:
        items = select_news(None, None, limit=3)
        return NewsFeedResponse(
            personalized=False,
            industry=None,
            region=None,
            items=[_to_item(row) for row in items],
        )

    industry = (profile.activity_direction or profile.industry or None)
    region = profile.region
    items = select_news(industry, region, limit=3)
    return NewsFeedResponse(
        personalized=True,
        industry=industry,
        region=region,
        items=[_to_item(row) for row in items],
    )
