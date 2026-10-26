"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — register ORM metadata for create_all
from app.config import get_settings
from app.db import Base, SessionLocal, engine, ensure_columns
from app.routers import applications, attachments, auth, health, manager, news, profile
from app.seed import run_seed


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    ensure_columns(engine)
    with SessionLocal() as session:
        run_seed(session)
        session.commit()
    yield


app = FastAPI(
    title="alfa-credit-cabinet",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(manager.router, prefix="/api")
app.include_router(attachments.router, prefix="/api")
app.include_router(news.router, prefix="/api")
