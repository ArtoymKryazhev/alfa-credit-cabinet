"""Attachment validation and storage for clarification answers."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings
from app.models.application import Attachment
from sqlalchemy.orm import Session

MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}
EXT_TO_MIME = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _safe_filename(name: str | None) -> str:
    raw = (name or "file").strip().replace("\\", "/").split("/")[-1]
    return raw[:200] if raw else "file"


def save_upload(
    db: Session,
    *,
    application_id: str,
    uploaded_by: int,
    upload: UploadFile,
) -> Attachment:
    filename = _safe_filename(upload.filename)
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Допустимы только файлы pdf, png, jpg",
        )

    content_type = (upload.content_type or "").split(";")[0].strip().lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Допустимы только файлы pdf, png, jpg",
        )
    mime = content_type or EXT_TO_MIME[ext]

    raw = upload.file.read(MAX_ATTACHMENT_BYTES + 1)
    if len(raw) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Размер файла не должен превышать 5 МБ",
        )
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Файл пуст",
        )

    attachment_id = str(uuid.uuid4())
    settings = get_settings()
    app_dir = settings.uploads_dir / application_id
    app_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{attachment_id}{ext}"
    dest = app_dir / stored_name
    dest.write_bytes(raw)

    relative_path = f"{application_id}/{stored_name}"
    row = Attachment(
        id=attachment_id,
        application_id=application_id,
        filename=filename,
        mime=mime,
        size=len(raw),
        path=relative_path,
        uploaded_by=uploaded_by,
    )
    db.add(row)
    db.flush()
    return row


def resolve_attachment_path(attachment: Attachment) -> Path:
    settings = get_settings()
    path = Path(attachment.path)
    if path.is_absolute():
        return path
    return settings.uploads_dir / path
