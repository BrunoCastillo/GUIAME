"""
Router de empresas.
Endpoints para gestión de empresas (multi-tenant).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.enums import Role
from app.models.company import Company
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class CompanyBase(BaseModel):
    """Esquema base de empresa."""
    name: str
    description: str = None


class CompanyCreate(CompanyBase):
    """Esquema para creación de empresa."""
    pass


class CompanyResponse(CompanyBase):
    """Esquema de respuesta de empresa."""
    id: int
    logo_url: str = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(require_role([Role.SYSTEM_ADMIN])),
    db: Session = Depends(get_db)
):
    """Crear nueva empresa (solo system_admin)."""
    new_company = Company(**company_data.dict())
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company


@router.get("/", response_model=List[CompanyResponse])
async def get_companies(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role([Role.SYSTEM_ADMIN, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """Listar empresas."""
    if current_user.role == Role.SYSTEM_ADMIN:
        companies = db.query(Company).offset(skip).limit(limit).all()
    else:
        companies = db.query(Company).filter(Company.id == current_user.company_id).all()
    
    return companies


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener empresa por ID."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar acceso
    if current_user.role != Role.SYSTEM_ADMIN and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    return company

