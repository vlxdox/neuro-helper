"""
Роутер для работы с нейросетями
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel
import json

from ..database.session import get_db
from ..database.models import NeuralNet, Tag, NeuralNetTag

router = APIRouter(prefix="/neural_nets", tags=["neural_nets"])


class NeuralNetResponse(BaseModel):
    id: int
    name: str
    description: str
    url: str
    price_type: str
    price_details: Optional[str] = None
    platforms: List[str] = []
    has_api: bool = False
    complexity: str
    languages: List[str] = []
    sanctions: bool = False
    tags: List[str] = []

    class Config:
        from_attributes = True


class FilterRequest(BaseModel):
    tags: List[str]


class WeightedFilterRequest(BaseModel):
    """Запрос на фильтрацию с весами"""
    tags: Dict[str, float]  # {"тег": вес}


def safe_int(value, default=0):
    try:
        if hasattr(value, 'value'):
            value = value.value
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def safe_str(value, default=""):
    try:
        if hasattr(value, 'value'):
            value = value.value
        return str(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def safe_bool(value, default=False):
    try:
        if hasattr(value, 'value'):
            value = value.value
        return bool(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def safe_list(value):
    try:
        if hasattr(value, 'value'):
            value = value.value
        if value is None:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return json.loads(value)
        return list(value) if value else []
    except (TypeError, ValueError, json.JSONDecodeError):
        return []


# ========== СПЕЦИФИЧНЫЕ МАРШРУТЫ ==========

@router.get("/count")
async def get_total_count(db: Session = Depends(get_db)):
    count = db.query(NeuralNet).count()
    return {"count": count}


@router.get("/tags")
async def get_all_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).order_by(Tag.name).all()
    return [tag.name for tag in tags]


@router.post("/filter")
async def filter_by_tags(request: FilterRequest, db: Session = Depends(get_db)):
    if not request.tags:
        neural_nets = db.query(NeuralNet).limit(500).all()
    else:
        neural_nets = db.query(NeuralNet).join(NeuralNetTag).join(Tag).filter(
            Tag.name.in_(request.tags)
        ).distinct().all()
    
    # Сортировка по релевантности (количество совпадающих тегов)
    def relevance_score(nn):
        nn_tags = [tag.tag.name for tag in nn.tags]
        return sum(1 for tag in request.tags if tag in nn_tags)
    
    neural_nets.sort(key=relevance_score, reverse=True)
    
    result = []
    for nn in neural_nets:
        tags = [tag.tag.name for tag in nn.tags]
        result.append({
            "id": safe_int(nn.id),
            "name": safe_str(nn.name),
            "description": safe_str(nn.description),
            "url": safe_str(nn.url),
            "price_type": safe_str(nn.price_type, "freemium"),
            "price_details": safe_str(nn.price_details),
            "platforms": safe_list(nn.platforms),
            "has_api": safe_bool(nn.has_api),
            "complexity": safe_str(nn.complexity, "low"),
            "languages": safe_list(nn.languages),
            "sanctions": safe_bool(nn.sanctions),
            "tags": tags
        })
    return result


@router.post("/filter_weighted")
async def filter_by_weighted_tags(
    request: WeightedFilterRequest,
    db: Session = Depends(get_db)
):
    """
    Фильтрация нейросетей по тегам с весами.
    Возвращает нейросети, отсортированные по релевантности с учётом весов.
    """
    if not request.tags:
        return []
    
    requested_tags = list(request.tags.keys())
    
    neural_nets = db.query(NeuralNet).join(
        NeuralNetTag
    ).join(
        Tag
    ).filter(
        Tag.name.in_(requested_tags)
    ).distinct().all()
    
    def calculate_relevance(nn):
        nn_tags = [tag.tag.name for tag in nn.tags]
        score = 0
        for tag, weight in request.tags.items():
            if tag in nn_tags:
                score += weight * 10
        return score
    
    neural_nets.sort(key=calculate_relevance, reverse=True)
    
    result = []
    for nn in neural_nets:
        tags = [tag.tag.name for tag in nn.tags]
        result.append({
            "id": safe_int(nn.id),
            "name": safe_str(nn.name),
            "description": safe_str(nn.description),
            "url": safe_str(nn.url),
            "price_type": safe_str(nn.price_type, "freemium"),
            "price_details": safe_str(nn.price_details),
            "platforms": safe_list(nn.platforms),
            "has_api": safe_bool(nn.has_api),
            "complexity": safe_str(nn.complexity, "low"),
            "languages": safe_list(nn.languages),
            "sanctions": safe_bool(nn.sanctions),
            "tags": tags,
            "relevance_score": calculate_relevance(nn)
        })
    
    return result


@router.get("/search")
async def search_neural_nets(q: str = "", limit: int = 100, db: Session = Depends(get_db)):
    if not q or len(q.strip()) < 2:
        return []
    
    search_term = f"%{q.lower()}%"
    
    try:
        neural_nets = db.query(NeuralNet).filter(
            (NeuralNet.name.ilike(search_term)) |
            (NeuralNet.description.ilike(search_term))
        ).limit(limit).all()
    except Exception as e:
        print(f"Ошибка поиска: {e}")
        return []
    
    def relevance_score(net):
        name_lower = safe_str(net.name).lower()
        desc_lower = safe_str(net.description).lower()
        q_lower = q.lower()
        if name_lower == q_lower:
            return -100
        if name_lower.startswith(q_lower):
            return -50
        if q_lower in name_lower:
            return -30
        if q_lower in desc_lower:
            return -10
        return 0
    
    neural_nets.sort(key=relevance_score)
    
    result = []
    for nn in neural_nets:
        tags = [tag.tag.name for tag in nn.tags]
        result.append({
            "id": safe_int(nn.id),
            "name": safe_str(nn.name),
            "description": safe_str(nn.description),
            "url": safe_str(nn.url),
            "price_type": safe_str(nn.price_type, "freemium"),
            "price_details": safe_str(nn.price_details),
            "platforms": safe_list(nn.platforms),
            "has_api": safe_bool(nn.has_api),
            "complexity": safe_str(nn.complexity, "low"),
            "languages": safe_list(nn.languages),
            "sanctions": safe_bool(nn.sanctions),
            "tags": tags
        })
    return result


# ========== ОСНОВНОЙ МАРШРУТ ==========

@router.get("/list")
async def get_all_neural_nets_list(
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    """Получить список всех нейросетей"""
    neural_nets = db.query(NeuralNet).offset(skip).limit(limit).all()
    
    result = []
    for nn in neural_nets:
        tags = [tag.tag.name for tag in nn.tags]
        result.append({
            "id": safe_int(nn.id),
            "name": safe_str(nn.name),
            "description": safe_str(nn.description),
            "url": safe_str(nn.url),
            "price_type": safe_str(nn.price_type, "freemium"),
            "price_details": safe_str(nn.price_details),
            "platforms": safe_list(nn.platforms),
            "has_api": safe_bool(nn.has_api),
            "complexity": safe_str(nn.complexity, "low"),
            "languages": safe_list(nn.languages),
            "sanctions": safe_bool(nn.sanctions),
            "tags": tags
        })
    return result


# ========== ДИНАМИЧЕСКИЙ МАРШРУТ (ВСЕГДА В КОНЦЕ) ==========

@router.get("/{neural_net_id}")
async def get_neural_net_by_id(neural_net_id: int, db: Session = Depends(get_db)):
    neural_net = db.query(NeuralNet).filter(NeuralNet.id == neural_net_id).first()
    if not neural_net:
        raise HTTPException(status_code=404, detail="Нейросеть не найдена")
    
    tags = [tag.tag.name for tag in neural_net.tags]
    return {
        "id": safe_int(neural_net.id),
        "name": safe_str(neural_net.name),
        "description": safe_str(neural_net.description),
        "url": safe_str(neural_net.url),
        "price_type": safe_str(neural_net.price_type, "freemium"),
        "price_details": safe_str(neural_net.price_details),
        "platforms": safe_list(neural_net.platforms),
        "has_api": safe_bool(neural_net.has_api),
        "complexity": safe_str(neural_net.complexity, "low"),
        "languages": safe_list(neural_net.languages),
        "sanctions": safe_bool(neural_net.sanctions),
        "tags": tags
    }