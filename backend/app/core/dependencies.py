"""
Dependencias compartidas para rutas.
Autenticación, autorización y validación de permisos.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.core.enums import Role

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtener usuario actual desde token JWT.
    Valida token y retorna usuario autenticado.
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    
    return user


def require_role(allowed_roles: list[Role]):
    """
    Decorador para requerir roles específicos.
    Factory que retorna dependencia de autorización.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos suficientes"
            )
        return current_user
    
    return role_checker


def require_company_access():
    """
    Verificar acceso a recursos de la empresa del usuario.
    Asegura que el usuario solo acceda a recursos de su empresa.
    """
    async def company_checker(
        current_user: User = Depends(get_current_user),
        company_id: Optional[int] = None
    ) -> User:
        if current_user.role == Role.SYSTEM_ADMIN:
            return current_user
        
        if company_id and current_user.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a esta empresa"
            )
        
        return current_user
    
    return company_checker

