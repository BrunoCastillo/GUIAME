"""
Router de eventos del calendario.
Endpoints para gestión de eventos y recordatorios.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.event import Event
from app.models.user import User
from app.core.enums import EventType
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class EventBase(BaseModel):
    """Esquema base de evento."""
    title: str
    description: str = None
    event_type: EventType
    start_time: datetime
    end_time: datetime
    location: str = None
    is_all_day: bool = False


class EventCreate(EventBase):
    """Esquema para creación de evento."""
    pass


class EventResponse(EventBase):
    """Esquema de respuesta de evento."""
    id: int
    company_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo evento."""
    new_event = Event(
        **event_data.dict(),
        company_id=current_user.company_id,
        user_id=current_user.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/", response_model=List[EventResponse])
async def get_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener eventos del calendario."""
    query = db.query(Event).filter(Event.company_id == current_user.company_id)
    
    if start_date:
        query = query.filter(Event.start_time >= start_date)
    if end_date:
        query = query.filter(Event.end_time <= end_date)
    
    events = query.order_by(Event.start_time).all()
    return events

