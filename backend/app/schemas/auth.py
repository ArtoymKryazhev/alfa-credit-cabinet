"""Auth request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    token: str
    role: str
    display_name: str
    company_name: str | None = None
    company_inn: str | None = None


class MeResponse(BaseModel):
    id: int
    login: str
    role: str
    display_name: str
    company_inn: str | None = None
    company_name: str | None = None
