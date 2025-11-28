"""
Router de empresas.
Endpoints para gestión de empresas (multi-tenant).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
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
    logo_url: str = None


class CompanyCreate(CompanyBase):
    """Esquema para creación de empresa."""
    pass


class CompanyUpdate(BaseModel):
    """Esquema para actualización de empresa."""
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


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
    current_user: User = Depends(require_role([Role.ADMINISTRADOR])),
    db: Session = Depends(get_db)
):
    """
    Crear nueva empresa (solo administradores).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🏢 Creando nueva empresa: Nombre={company_data.name}")
    logger.info(f"👤 Usuario creador: ID={current_user.id}, Email={current_user.email}, Role={current_user.role}")
    
    new_company = Company(**company_data.dict())
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    logger.info(f"✅ Empresa creada exitosamente: ID={new_company.id}, Nombre={new_company.name}")
    return new_company


@router.get("/", response_model=List[CompanyResponse])
async def get_companies(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role([Role.ADMINISTRADOR])),
    db: Session = Depends(get_db)
):
    """
    Listar todas las empresas.
    Solo administradores del sistema pueden listar todas las empresas.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"📋 Listando empresas (skip={skip}, limit={limit})")
    companies = db.query(Company).offset(skip).limit(limit).all()
    logger.info(f"✅ {len(companies)} empresas encontradas")
    
    return companies


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener empresa por ID."""
    import logging
    logger = logging.getLogger(__name__)
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        logger.warning(f"❌ Empresa no encontrada: ID={company_id}")
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar acceso - solo administradores pueden ver cualquier empresa
    if current_user.role != Role.ADMINISTRADOR.value and current_user.company_id != company_id:
        logger.warning(f"❌ Acceso denegado a empresa {company_id} para usuario {current_user.id}")
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    logger.info(f"✅ Empresa obtenida: ID={company_id}, Nombre={company.name}")
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    current_user: User = Depends(require_role([Role.ADMINISTRADOR])),
    db: Session = Depends(get_db)
):
    """
    Actualizar empresa.
    Solo administradores del sistema pueden actualizar empresas.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔧 Actualizando empresa: ID={company_id}")
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        logger.warning(f"❌ Empresa no encontrada: ID={company_id}")
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Actualizar campos proporcionados
    update_data = company_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(company, key, value)
    
    db.commit()
    db.refresh(company)
    
    logger.info(f"✅ Empresa actualizada: ID={company_id}, Nombre={company.name}")
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    current_user: User = Depends(require_role([Role.ADMINISTRADOR])),
    db: Session = Depends(get_db)
):
    """
    Eliminar empresa (soft delete - desactivar).
    Solo administradores del sistema pueden eliminar empresas.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🗑️ Eliminando empresa: ID={company_id}")
    
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        logger.warning(f"❌ Empresa no encontrada: ID={company_id}")
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar si hay usuarios asociados
    from app.models.user import User
    users_count = db.query(User).filter(User.company_id == company_id).count()
    if users_count > 0:
        logger.warning(f"⚠️ Empresa tiene {users_count} usuarios asociados. Desactivando en lugar de eliminar.")
        # Soft delete - desactivar en lugar de eliminar
        company.is_active = False
        db.commit()
        logger.info(f"✅ Empresa desactivada: ID={company_id}")
    else:
        # Si no hay usuarios, eliminar físicamente
        db.delete(company)
        db.commit()
        logger.info(f"✅ Empresa eliminada físicamente: ID={company_id}")
    
    return None

