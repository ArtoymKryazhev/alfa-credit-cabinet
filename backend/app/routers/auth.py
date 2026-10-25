"""Auth endpoints: login, logout, me."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.passwords import verify_password
from app.db import get_db
from app.models.session import Session as AuthSession
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)

_SESSION_TTL = timedelta(days=7)


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.scalar(select(User).where(User.login == body.login))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password",
        )
    token = secrets.token_urlsafe(32)
    db.add(
        AuthSession(
            token=token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + _SESSION_TTL,
        )
    )
    db.commit()
    return LoginResponse(
        token=token,
        role=user.role,
        display_name=user.display_name,
        company_name=user.company_name,
        company_inn=user.company_inn,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return
    row = db.scalar(
        select(AuthSession).where(AuthSession.token == credentials.credentials)
    )
    if row is not None:
        db.delete(row)
        db.commit()


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        id=user.id,
        login=user.login,
        role=user.role,
        display_name=user.display_name,
        company_inn=user.company_inn,
        company_name=user.company_name,
    )
