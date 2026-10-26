"""Attachment download with ownership / manager checks."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db import get_db
from app.models.application import Application, Attachment
from app.models.user import User
from app.services.attachments import resolve_attachment_path

router = APIRouter(prefix="/attachments", tags=["attachments"])


@router.get("/{attachment_id}")
def download_attachment(
    attachment_id: str,
    user: User = Depends(require_roles("client", "manager")),
    db: Session = Depends(get_db),
) -> FileResponse:
    attachment = db.get(Attachment, attachment_id)
    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден",
        )

    application = db.get(Application, attachment.application_id)
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден",
        )

    if user.role == "client" and application.client_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден",
        )

    path = resolve_attachment_path(attachment)
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден",
        )

    return FileResponse(
        path=path,
        media_type=attachment.mime,
        filename=attachment.filename,
    )
