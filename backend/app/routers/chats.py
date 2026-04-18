"""
Роутер для работы с историей чатов
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Any, Optional, Dict
from datetime import datetime, timezone
import logging
import json

from ..database.session import get_db
from ..database.models import Chat, User
from ..services.auth_service import decode_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chats", tags=["chats"])


class ChatCreate(BaseModel):
    mode: str
    query: str
    filters: Optional[List[str]] = []
    results: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    id: int
    mode: str
    query: str
    filters: List[str]
    results: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedChatsResponse(BaseModel):
    chats: List[ChatResponse]
    total: int
    page: int
    limit: int
    total_pages: int


def try_get_current_user(request: Request, db: Session) -> Optional[User]:
    """
    Пытается получить текущего пользователя из JWT токена
    Возвращает None если пользователь не авторизован
    """
    token = None
    
    # Проверяем Authorization header
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    # Если нет в header, проверяем cookie
    if not token:
        token = request.cookies.get("access_token")
    
    if not token:
        return None
    
    # Декодируем токен
    payload = decode_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    
    if not user_id:
        return None
    
    # Преобразуем user_id в int для сравнения с БД
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return None
    
    # Получаем пользователя из БД
    user = db.query(User).filter(User.id == user_id_int).first()
    
    return user


def safe_get_int_value(obj, attr_name: str, default: int = 0) -> int:
    """Безопасно получает целочисленное значение из объекта"""
    try:
        value = getattr(obj, attr_name)
        if value is None:
            return default
        if hasattr(value, 'value'):
            value = value.value
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_get_str_value(obj, attr_name: str, default: str = "") -> str:
    """Безопасно получает строковое значение из объекта"""
    try:
        value = getattr(obj, attr_name)
        if value is None:
            return default
        if hasattr(value, 'value'):
            value = value.value
        return str(value)
    except (TypeError, ValueError):
        return default


def safe_get_datetime_value(obj, attr_name: str):
    """Безопасно получает datetime значение из объекта"""
    try:
        value = getattr(obj, attr_name)
        if value is None:
            return datetime.now(timezone.utc)
        if hasattr(value, 'value'):
            value = value.value
        return value
    except (TypeError, ValueError):
        return datetime.now(timezone.utc)


def safe_get_list_value(obj, attr_name: str) -> list:
    """Безопасно получает значение списка из объекта"""
    try:
        value = getattr(obj, attr_name)
        if value is None:
            return []
        if hasattr(value, 'value'):
            value = value.value
        if isinstance(value, str):
            return json.loads(value)
        if isinstance(value, list):
            return value
        return list(value) if value else []
    except (TypeError, ValueError, json.JSONDecodeError):
        return []


@router.options("/")
async def options_chats():
    """Обработка preflight запросов для /chats/"""
    return Response(
        content="",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )


@router.options("/{chat_id}")
async def options_chat_id():
    """Обработка preflight запросов для /chats/{chat_id}"""
    return Response(
        content="",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )


@router.post("/", response_model=Optional[ChatResponse])
async def create_chat(
    chat_data: ChatCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Сохраняет новый чат в историю ТОЛЬКО для авторизованных пользователей
    """
    try:
        logger.info(f"📝 Запрос на создание чата: mode={chat_data.mode}, query={chat_data.query[:50]}...")
        
        user = try_get_current_user(request, db)
        
        if not user:
            logger.info("👤 Пользователь не авторизован, чат не сохранен")
            return ChatResponse(
                id=-1,
                mode=chat_data.mode,
                query=chat_data.query,
                filters=chat_data.filters or [],
                results=chat_data.results or [],
                created_at=datetime.now(timezone.utc)
            )
        
        new_chat = Chat(
            user_id=user.id,
            mode=chat_data.mode,
            query_text=chat_data.query,
            filters=chat_data.filters or [],
            results=chat_data.results or [],
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        logger.info(f"✅ Чат сохранен для пользователя {user.email}, id={safe_get_int_value(new_chat, 'id')}")
        
        return ChatResponse(
            id=safe_get_int_value(new_chat, 'id'),
            mode=safe_get_str_value(new_chat, 'mode'),
            query=safe_get_str_value(new_chat, 'query_text'),
            filters=safe_get_list_value(new_chat, 'filters'),
            results=safe_get_list_value(new_chat, 'results'),
            created_at=safe_get_datetime_value(new_chat, 'created_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при создании чата: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return ChatResponse(
            id=-1,
            mode=chat_data.mode,
            query=chat_data.query,
            filters=chat_data.filters or [],
            results=chat_data.results or [],
            created_at=datetime.now(timezone.utc)
        )


@router.get("/", response_model=PaginatedChatsResponse)
async def get_chats(
    request: Request,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Получает историю чатов с пагинацией
    """
    try:
        logger.info(f"📋 Запрос на получение чатов: page={page}, limit={limit}")
        
        user = try_get_current_user(request, db)
        
        if not user:
            return PaginatedChatsResponse(
                chats=[],
                total=0,
                page=page,
                limit=limit,
                total_pages=0
            )
        
        # Подсчитываем общее количество
        total = db.query(Chat).filter(Chat.user_id == user.id).count()
        
        # Получаем чаты с пагинацией
        offset = (page - 1) * limit
        chats = db.query(Chat).filter(
            Chat.user_id == user.id
        ).order_by(
            Chat.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        total_pages = (total + limit - 1) // limit
        
        result = []
        for chat in chats:
            result.append(ChatResponse(
                id=safe_get_int_value(chat, 'id'),
                mode=safe_get_str_value(chat, 'mode'),
                query=safe_get_str_value(chat, 'query_text'),
                filters=safe_get_list_value(chat, 'filters'),
                results=safe_get_list_value(chat, 'results'),
                created_at=safe_get_datetime_value(chat, 'created_at')
            ))
        
        return PaginatedChatsResponse(
            chats=result,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при получении чатов: {e}")
        return PaginatedChatsResponse(
            chats=[],
            total=0,
            page=page,
            limit=limit,
            total_pages=0
        )


@router.get("/all")
async def get_all_chats_for_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Получает ВСЕ чаты для статистики (без пагинации)
    """
    try:
        user = try_get_current_user(request, db)
        
        if not user:
            return []
        
        chats = db.query(Chat).filter(
            Chat.user_id == user.id
        ).order_by(
            Chat.created_at.asc()
        ).all()
        
        result = []
        for chat in chats:
            result.append(ChatResponse(
                id=safe_get_int_value(chat, 'id'),
                mode=safe_get_str_value(chat, 'mode'),
                query=safe_get_str_value(chat, 'query_text'),
                filters=safe_get_list_value(chat, 'filters'),
                results=safe_get_list_value(chat, 'results'),
                created_at=safe_get_datetime_value(chat, 'created_at')
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Ошибка при получении чатов для статистики: {e}")
        return []


@router.get("/{chat_id}", response_model=Optional[ChatResponse])
async def get_chat_by_id(
    chat_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Получает конкретный чат по ID
    """
    try:
        logger.info(f"🔍 Запрос на получение чата: id={chat_id}")
        
        user = try_get_current_user(request, db)
        
        if not user:
            logger.info("👤 Пользователь не авторизован, чат не найден")
            raise HTTPException(status_code=404, detail="Чат не найден")
        
        chat = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Чат не найден")
        
        return ChatResponse(
            id=safe_get_int_value(chat, 'id'),
            mode=safe_get_str_value(chat, 'mode'),
            query=safe_get_str_value(chat, 'query_text'),
            filters=safe_get_list_value(chat, 'filters'),
            results=safe_get_list_value(chat, 'results'),
            created_at=safe_get_datetime_value(chat, 'created_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при получении чата: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при получении чата: {str(e)}")


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Удаляет чат из истории
    """
    try:
        logger.info(f"🗑️ Запрос на удаление чата: id={chat_id}")
        
        user = try_get_current_user(request, db)
        
        if not user:
            logger.info("👤 Пользователь не авторизован, удаление пропущено")
            return {"message": "Чат удалён", "deleted": False}
        
        chat = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user.id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Чат не найден")
        
        db.delete(chat)
        db.commit()
        
        logger.info(f"✅ Чат удален: id={chat_id}")
        
        return {"message": "Чат удалён", "deleted": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка при удалении чата: {e}")
        db.rollback()
        return {"message": "Ошибка при удалении", "deleted": False}