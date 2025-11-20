"""
Router de RAG (Retrieval Augmented Generation).
Endpoints para chat con IA usando documentos indexados.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat import ChatLog
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()


class RAGQuery(BaseModel):
    """Esquema para consulta RAG."""
    query: str
    company_id: Optional[int] = None


class RAGResponse(BaseModel):
    """Esquema de respuesta RAG."""
    response: str
    sources: List[dict] = []
    model_used: str
    tokens_used: Optional[int] = None


@router.post("/query", response_model=RAGResponse)
async def query_rag(
    rag_query: RAGQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Consultar RAG con documentos indexados.
    TODO: Implementar pipeline completo:
    1. Embedding de la pregunta
    2. Búsqueda vectorial en ChromaDB/pgvector
    3. Recuperación de top-k documentos
    4. Generación con DeepSeek/Ollama
    5. Retornar respuesta + fuentes
    """
    company_id = rag_query.company_id or current_user.company_id
    
    # Placeholder - implementar lógica RAG completa
    response_text = f"Respuesta a: {rag_query.query}"
    
    # Guardar en log
    chat_log = ChatLog(
        user_id=current_user.id,
        company_id=company_id,
        query=rag_query.query,
        response=response_text,
        sources=[],
        model_used="deepseek"
    )
    db.add(chat_log)
    db.commit()
    
    return RAGResponse(
        response=response_text,
        sources=[],
        model_used="deepseek"
    )


@router.get("/history", response_model=List[dict])
async def get_rag_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener historial de consultas RAG."""
    logs = db.query(ChatLog).filter(
        ChatLog.user_id == current_user.id
    ).order_by(ChatLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": log.id,
            "query": log.query,
            "response": log.response,
            "sources": log.sources,
            "created_at": log.created_at
        }
        for log in logs
    ]

