"""SQLAlchemy 엔진/세션 설정 (S3 [API] 소유)."""
from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]

# backend/.env 우선, 그 다음 저장소 루트 .env. 이미 설정된 환경변수는 덮어쓰지 않는다.
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")


class Base(DeclarativeBase):
    pass


_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _enable_sqlite_fk(dbapi_connection, _record) -> None:  # pragma: no cover - trivial
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    """모든 테이블 생성 (모델 import 후 호출)."""
    from app import models  # noqa: F401  (Base.metadata 등록)

    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_storage_dir() -> Path:
    """원본 이미지 저장 폴더. 기본 backend/app/storage (Git 제외)."""
    configured = os.getenv("STORAGE_DIR")
    path = Path(configured) if configured else BACKEND_DIR / "app" / "storage"
    path.mkdir(parents=True, exist_ok=True)
    return path
