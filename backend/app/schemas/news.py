"""Personalized news response schemas."""

from __future__ import annotations

from pydantic import BaseModel


class NewsItemResponse(BaseModel):
    id: str
    title: str
    summary: str
    published_at: str
    industries: list[str]
    regions: list[str]
    source: str
    as_of: str


class NewsFeedResponse(BaseModel):
    personalized: bool
    industry: str | None = None
    region: str | None = None
    items: list[NewsItemResponse]
