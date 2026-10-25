"""Manager stubs (full queue in T05)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth.deps import require_roles
from app.models.user import User

router = APIRouter(prefix="/manager", tags=["manager"])


@router.get("/ping")
def ping(_user: User = Depends(require_roles("manager"))) -> dict[str, str]:
    return {"status": "ok"}
