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

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtener usuario actual desde token JWT.
    Valida token y retorna usuario autenticado.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if credentials is None:
        logger.warning("❌ No se proporcionó token de autorización")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorización requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    logger.info(f"🔐 Validando token (longitud: {len(token) if token else 0})")
    
    payload = decode_token(token)
    
    if payload is None:
        logger.warning("❌ Token inválido o no se pudo decodificar")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"✅ Token decodificado correctamente. Payload: user_id={payload.get('sub')}, role={payload.get('role')}")
    
    # JWT almacena "sub" como string, convertir a int
    user_id_str = payload.get("sub")
    if user_id_str is None:
        logger.warning("❌ Token no contiene user_id (sub)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        logger.warning(f"❌ user_id no es un número válido: {user_id_str}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning(f"❌ Usuario no encontrado con ID: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    
    logger.info(f"✅ Usuario autenticado: ID={user.id}, Email={user.email}, Role={user.role}")
    return user


def require_role(allowed_roles: list[Role]):
    """
    Decorador para requerir roles específicos.
    Factory que retorna dependencia de autorización.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        import logging
        logger = logging.getLogger(__name__)
        
        # Comparar el valor del rol (string) con los valores de los roles permitidos
        allowed_role_values = [role.value if isinstance(role, Role) else role for role in allowed_roles]
        logger.info(f"🔐 Verificando rol: Usuario={current_user.role}, Permitidos={allowed_role_values}")
        
        if current_user.role not in allowed_role_values:
            logger.warning(f"❌ Acceso denegado: Usuario={current_user.role}, Requeridos={allowed_role_values}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permisos suficientes. Rol requerido: {allowed_role_values}, Rol actual: {current_user.role}"
            )
        
        logger.info(f"✅ Acceso permitido para rol: {current_user.role}")
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
        if current_user.role == Role.ADMINISTRADOR.value:
            return current_user
        
        if company_id and current_user.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a esta empresa"
            )
        
        return current_user
    
    return company_checker

