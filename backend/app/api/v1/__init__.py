"""
Router principal de la API v1.
Agregación de todos los routers de endpoints.
"""
from fastapi import APIRouter
from app.api.v1.routers import (
    auth,
    users,
    companies,
    courses,
    documents,
    chat,
    rag,
    events,
    quizzes,
    notifications,
)

api_router = APIRouter()

# Incluir todos los routers
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])
api_router.include_router(companies.router, prefix="/companies", tags=["Empresas"])
api_router.include_router(courses.router, prefix="/courses", tags=["Cursos"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documentos"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG"])
api_router.include_router(events.router, prefix="/events", tags=["Eventos"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Evaluaciones"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notificaciones"])

