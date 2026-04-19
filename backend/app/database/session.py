"""
Настройка подключения к базе данных
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pathlib import Path
from typing import Generator


DB_PATH = Path(__file__).parent.parent.parent.parent / "data" / "neurohelper.db"
DB_URL = f"sqlite:///{DB_PATH}"


DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DB_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency для FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Создаёт все таблицы в базе данных"""
    from .models import Base
    Base.metadata.create_all(bind=engine)
    print(f"База данных инициализирована: {DB_PATH}")