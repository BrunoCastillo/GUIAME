"""
Router de chat tradicional.
Endpoints para mensajería entre usuarios.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.chat import ChatMessage
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ChatMessageCreate(BaseModel):
    """Esquema para crear mensaje."""
    receiver_id: Optional[int] = None
    message: str


class ChatMessageResponse(BaseModel):
    """Esquema de respuesta de mensaje."""
    id: int
    sender_id: int
    receiver_id: Optional[int]
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enviar mensaje."""
    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        message=message_data.message
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/", response_model=List[ChatMessageResponse])
async def get_messages(
    receiver_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener mensajes del usuario."""
    query = db.query(ChatMessage).filter(
        (ChatMessage.sender_id == current_user.id) | 
        (ChatMessage.receiver_id == current_user.id)
    )
    
    if receiver_id:
        query = query.filter(
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.receiver_id == receiver_id)) |
            ((ChatMessage.sender_id == receiver_id) & (ChatMessage.receiver_id == current_user.id))
        )
    
    messages = query.order_by(ChatMessage.created_at.desc()).offset(skip).limit(limit).all()
    return messages

