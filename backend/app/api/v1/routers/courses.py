"""
Router de cursos.
Endpoints para gestión de cursos, módulos y contenidos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.enums import Role
from app.models.course import Course, Module, ModuleContent, Enrollment
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class CourseBase(BaseModel):
    """Esquema base de curso."""
    title: str
    description: str = None


class CourseCreate(CourseBase):
    """Esquema para creación de curso."""
    instructor_id: int


class CourseResponse(CourseBase):
    """Esquema de respuesta de curso."""
    id: int
    company_id: int
    instructor_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(require_role([Role.COMPANY_ADMIN, Role.INSTRUCTOR])),
    db: Session = Depends(get_db)
):
    """Crear nuevo curso."""
    new_course = Course(
        **course_data.dict(),
        company_id=current_user.company_id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar cursos de la empresa del usuario."""
    courses = db.query(Course).filter(
        Course.company_id == current_user.company_id,
        Course.is_active == True
    ).offset(skip).limit(limit).all()
    
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener curso por ID."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if course.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    return course


@router.post("/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Inscribirse a un curso."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar si ya está inscrito
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya está inscrito en este curso")
    
    enrollment = Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    
    return {"message": "Inscripción exitosa"}

