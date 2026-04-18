"""
Роутер для работы с Ollama (внутренний API)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict

from ..services.ollama_service import ollama_service

router = APIRouter(prefix="/internal", tags=["internal"])


class ExtractTagsRequest(BaseModel):
    query: str


class ExtractTagsResponse(BaseModel):
    tags: List[str]
    available: bool
    message: Optional[str] = None


@router.post("/extract_tags", response_model=ExtractTagsResponse)
async def extract_tags(request: ExtractTagsRequest):
    """
    Извлекает теги из текста задачи с помощью Ollama.
    Внутренний эндпоинт для фронтенда.
    """
    if not ollama_service.is_available():
        return ExtractTagsResponse(
            tags=[],
            available=False,
            message="Ollama не запущен. Используйте ручной выбор тегов."
        )
    
    try:
        tags = ollama_service.extract_tags_with_weights(request.query)
        tag_list = list(tags.keys())
        return ExtractTagsResponse(
            tags=tag_list,
            available=True,
            message=f"Извлечено {len(tag_list)} тегов" if tag_list else "Теги не найдены"
        )
    except HTTPException as e:
        return ExtractTagsResponse(
            tags=[],
            available=False,
            message=e.detail
        )


@router.get("/extract_tags_weighted")
async def extract_tags_weighted(query: str):
    """
    Извлекает теги с весами из текста задачи.
    Пример: /internal/extract_tags_weighted?query=хочу создать сайт
    """
    result = ollama_service.extract_tags_with_weights(query)
    return {
        "query": query,
        "tags": result,
        "count": len(result)
    }


@router.get("/available_tags")
async def get_available_tags():
    """Возвращает список всех доступных тегов"""
    return {
        "tags": ollama_service.get_available_tags(),
        "count": len(ollama_service.get_available_tags())
    }


@router.get("/ollama_status")
async def ollama_status():
    """Проверяет статус Ollama"""
    return {
        "available": ollama_service.is_available(),
        "model": ollama_service.model,
        "host": ollama_service.host
    }


@router.get("/extract_tags_test")
async def extract_tags_test(query: str):
    """
    Извлекает теги из текста задачи.
    Пример: /internal/extract_tags_test?query=хочу создать сайт для магазина одежды
    """
    result = ollama_service.extract_tags_with_weights(query)
    tag_list = list(result.keys())
    return {
        "query": query,
        "tags": tag_list,
        "weights": result,
        "count": len(tag_list)
    }