from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="NeuroHelper API",
    description="Навигатор по нейросетям",
    version="0.1.0"
)

# GZIP сжатие (для ответов больше 500 байт)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", "session-secret-key-change-me"),
    https_only=False,
    same_site="lax"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.137.1:5173",
        "http://192.168.137.1:8080",
        "http://192.168.137.1.nip.io:5173",
        "http://192.168.137.1.nip.io:8080"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Подключаем роутеры
from .routers import ollama, neural_nets, favorites, chats, auth
app.include_router(auth.router)
app.include_router(ollama.router)
app.include_router(neural_nets.router)
app.include_router(favorites.router)
app.include_router(chats.router)

@app.get("/health")
def health():
    return {"status": "healthy"}

# Статика фронтенда
frontend_dist = os.path.join(os.path.dirname(__file__), "../../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")