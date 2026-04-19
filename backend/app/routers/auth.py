"""
Роутер для авторизации через Google OAuth
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from datetime import datetime, timezone
import os
import logging
from dotenv import load_dotenv

from ..database.session import get_db
from ..database.models import User
from ..services.auth_service import create_access_token

load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# Настройка OAuth
GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("VITE_GOOGLE_CLIENT_SECRET", "")

# Вывод информации о конфигурации при запуске
logger.info("=" * 50)
logger.info("🔐 GOOGLE OAuth CONFIGURATION")
logger.info("=" * 50)
logger.info(f"GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID[:20]}..." if GOOGLE_CLIENT_ID else "❌ GOOGLE_CLIENT_ID не установлен")
logger.info(f"GOOGLE_CLIENT_SECRET: {'✅ Установлен' if GOOGLE_CLIENT_SECRET else '❌ Не установлен'}")
logger.info("=" * 50)

config_data = {
    "GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": GOOGLE_CLIENT_SECRET,
}
config = Config(environ=config_data)

oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
    }
)


def get_backend_url(request: Request) -> str:
    """
    Динамически определяет URL бэкенда на основе заголовков запроса.
    Работает с localhost, прямым IP и nip.io доменами.
    """
    host = request.headers.get("host", "")
    scheme = "https" if request.url.scheme == "https" else "http"
    return f"{scheme}://{host}"


def get_frontend_url(request: Request) -> str:
    """
    По хосту бэкенда определяет URL фронтенда.
    Бэкенд на порту 8080, фронтенд на том же хосте, но порт 5173.
    """
    host = request.headers.get("host", "")
    host_without_port = host.split(":")[0]
    scheme = "https" if request.url.scheme == "https" else "http"
    
    # Для localhost — стандартный порт 5173
    if host_without_port in ["localhost", "127.0.0.1"]:
        return f"{scheme}://localhost:5173"
    
    # Для внешних адресов (IP, nip.io, xip.io) — тот же хост, порт 5173
    return f"{scheme}://{host_without_port}:5173"


@router.get("/google/login")
async def google_login(request: Request):
    """Перенаправляет на страницу входа Google"""
    backend_url = get_backend_url(request)
    redirect_uri = f"{backend_url}/auth/google/callback"
    
    logger.info(f"🔐 Начало авторизации через Google")
    logger.info(f"   Хост запроса: {request.headers.get('host')}")
    logger.info(f"   Redirect URI (Google отправит сюда): {redirect_uri}")
    logger.info(f"   ⚠️ Убедитесь, что этот URI добавлен в Google Console")
    
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Обрабатывает callback от Google после авторизации"""
    logger.info("📞 Google Callback вызван (бэкенд эндпоинт)")
    logger.info(f"Request params: {dict(request.query_params)}")
    
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        
        if not user_info:
            logger.error("❌ Не удалось получить данные пользователя")
            raise HTTPException(status_code=400, detail="Не удалось получить данные пользователя")
        
        email = user_info.get("email")
        if not email:
            logger.error("❌ Email не получен от Google")
            raise HTTPException(status_code=400, detail="Email не получен от Google")
        
        logger.info(f"👤 Получены данные пользователя:")
        logger.info(f"   - Email: {email}")
        logger.info(f"   - Name: {user_info.get('name')}")
        logger.info(f"   - Google ID: {user_info.get('sub')[:20]}...")
        
        user: User = db.query(User).filter(User.google_id == user_info.get("sub")).first()
        
        if not user:
            existing_user: User = db.query(User).filter(User.email == email).first()
            if existing_user:
                logger.warning(f"⚠️ Пользователь с email {email} уже существует, связываем с Google")
                setattr(existing_user, 'google_id', user_info.get("sub"))
                setattr(existing_user, 'avatar_url', user_info.get("picture"))
                setattr(existing_user, 'last_login', datetime.now(timezone.utc))
                user = existing_user
            else:
                logger.info("📝 Создаём нового пользователя...")
                user = User(
                    email=email,
                    name=user_info.get("name"),
                    google_id=user_info.get("sub"),
                    avatar_url=user_info.get("picture"),
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    last_login=datetime.now(timezone.utc)
                )
                db.add(user)
                logger.info("✅ Новый пользователь создан")
        else:
            logger.info("🔄 Обновляем существующего пользователя...")
            setattr(user, 'last_login', datetime.now(timezone.utc))
            if user_info.get("picture"):
                setattr(user, 'avatar_url', user_info.get("picture"))
            logger.info("✅ Пользователь обновлён")
        
        db.commit()
        db.refresh(user)
        
        if user.is_active is False:
            logger.warning(f"⚠️ Попытка входа в заблокированный аккаунт: {email}")
            frontend_url = get_frontend_url(request)
            return RedirectResponse(url=f"{frontend_url}/auth/callback?error=account_disabled")
        
        # Создаём JWT токен
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        logger.info(f"🔑 JWT токен создан для user_id={user.id}")
        
        # Динамически определяем фронтенд URL
        frontend_url = get_frontend_url(request)
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}"
        logger.info(f"➡️ Перенаправление на фронтенд: {redirect_url}")
        
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        logger.error(f"❌ Ошибка авторизации: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка авторизации: {str(e)}")


@router.post("/logout")
async def logout():
    """Выход из системы"""
    logger.info("🚪 Выход из системы")
    return {"message": "Выход выполнен"}


@router.get("/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Получает информацию о текущем пользователе по JWT токену"""
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
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.is_active is False:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован или удалён")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar_url,
        "isLoggedIn": True
    }