"""
Роутер для работы с избранным
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database.session import get_db
from ..database.models import User, Favorite, NeuralNet

router = APIRouter(prefix="/favorites", tags=["favorites"])


def get_current_user_from_token(request: Request, db: Session) -> Optional[User]:
    """
    Получает текущего пользователя из JWT токена
    """
    from ..services.auth_service import decode_token
    
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
    
    # Преобразуем user_id в int
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return None
    
    # Получаем пользователя из БД
    user = db.query(User).filter(User.id == user_id_int).first()
    return user


@router.get("/", response_model=List[int])
async def get_favorites(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Получить список ID нейросетей, добавленных в избранное текущего пользователя
    """
    user = get_current_user_from_token(request, db)
    if not user:
        return []  # Неавторизованным возвращаем пустой список
    
    favorites = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    return [fav.neural_net_id for fav in favorites]


@router.post("/{neural_net_id}")
async def add_to_favorites(
    neural_net_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Добавить нейросеть в избранное
    """
    user = get_current_user_from_token(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    # Проверяем, существует ли нейросеть
    neural_net = db.query(NeuralNet).filter(NeuralNet.id == neural_net_id).first()
    if not neural_net:
        raise HTTPException(status_code=404, detail="Нейросеть не найдена")
    
    # Проверяем, не добавлена ли уже
    existing = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.neural_net_id == neural_net_id
    ).first()
    
    if existing:
        return {"message": "Уже в избранном", "added": False}
    
    favorite = Favorite(user_id=user.id, neural_net_id=neural_net_id)
    db.add(favorite)
    db.commit()
    
    return {"message": "Добавлено в избранное", "added": True}


@router.delete("/{neural_net_id}")
async def remove_from_favorites(
    neural_net_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Удалить нейросеть из избранного
    """
    user = get_current_user_from_token(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.neural_net_id == neural_net_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Нейросеть не найдена в избранном")
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Удалено из избранного", "removed": True}