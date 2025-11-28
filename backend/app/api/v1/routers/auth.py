"""
Router de autenticación.
Endpoints para login, registro, refresh token y gestión de sesión.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
from app.core.enums import Role
from app.models.user import User, Profile
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse
from pydantic import BaseModel
from datetime import timedelta
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar nuevo usuario (MODO DEMO - Sin validaciones estrictas).
    Crea usuario y perfil básico.
    Permite cualquier correo y contraseña para la demo.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 50)
    logger.info("Iniciando registro de usuario")
    logger.info(f"Email: {user_data.email}")
    logger.info(f"Role: {user_data.role} (tipo: {type(user_data.role)})")
    logger.info(f"Company ID: {user_data.company_id}")
    logger.info("=" * 50)
    
    try:
        # Verificar conexión a la base de datos
        logger.info("Verificando conexion a la base de datos...")
        try:
            db.execute(text("SELECT 1"))  # Test query simple
            logger.info("Conexion a la base de datos OK")
        except Exception as db_test_error:
            logger.error(f"ERROR en test de BD: {type(db_test_error).__name__}: {str(db_test_error)}")
            raise
        
        # MODO DEMO: Permitir registro sin validaciones estrictas
        # Si el email ya existe, actualizar el usuario existente en lugar de rechazar
        logger.info(f"Buscando usuario existente con email: {user_data.email}")
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        logger.info(f"Usuario existente encontrado: {existing_user is not None}")
        if existing_user:
            # En modo demo, actualizar la contraseña del usuario existente
            existing_user.hashed_password = get_password_hash(user_data.password)
            # Convertir role a enum si es necesario
            if user_data.role:
                if isinstance(user_data.role, str):
                    existing_user.role = Role(user_data.role.lower())
                else:
                    existing_user.role = user_data.role
            existing_user.is_active = True
            db.commit()
            db.refresh(existing_user)
            return existing_user
        
        # Crear nuevo usuario
        logger.info("Creando nuevo usuario...")
        logger.info("Iniciando hash de contraseña...")
        try:
            hashed_password = get_password_hash(user_data.password)
            logger.info(f"Contraseña hasheada exitosamente: {hashed_password[:20]}...")
        except Exception as hash_error:
            logger.error(f"Error al hashear contraseña: {type(hash_error).__name__}: {str(hash_error)}")
            raise
        
        # Asegurar que el role sea un enum Role válido
        # Mapear roles del frontend a los roles del sistema
        role_mapping = {
            'student': Role.ESTUDIANTE,
            'estudiante': Role.ESTUDIANTE,
            'instructor': Role.PROFESOR,
            'profesor': Role.PROFESOR,
            'teacher': Role.PROFESOR,
            'admin': Role.ADMINISTRADOR,
            'administrador': Role.ADMINISTRADOR,
            'system_admin': Role.ADMINISTRADOR,
            'company_admin': Role.COMPANY_ADMIN
        }
        
        try:
            if user_data.role:
                if isinstance(user_data.role, str):
                    # Intentar convertir el string a Role enum usando el mapeo
                    role_str = user_data.role.lower()
                    logger.info(f"Intentando convertir role '{role_str}' a enum...")
                    
                    # Primero intentar con el mapeo
                    if role_str in role_mapping:
                        user_role = role_mapping[role_str]
                    else:
                        # Si no está en el mapeo, intentar directamente
                        user_role = Role(role_str)
                else:
                    user_role = user_data.role
            else:
                user_role = Role.ESTUDIANTE
        except ValueError as ve:
            logger.error(f"Error al convertir role: {ve}")
            logger.error(f"Roles validos son: {[r.value for r in Role]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role invalido: {user_data.role}. Roles validos: {[r.value for r in Role]}"
            )
        
        logger.info(f"Role asignado: {user_role} (tipo: {type(user_role)})")
        
        # Asegurar que company_id sea None si no se proporciona o es 0 (evitar problemas con foreign key)
        company_id = user_data.company_id if user_data.company_id and user_data.company_id != 0 else None
        logger.info(f"company_id (procesado): {company_id} (original: {user_data.company_id})")
        
        try:
            # Extraer el valor del enum como string para guardarlo en la BD
            role_value = user_role.value if isinstance(user_role, Role) else str(user_role)
            logger.info(f"Role value que se guardara en BD: '{role_value}' (tipo: {type(role_value)})")
            
            new_user = User(
                email=user_data.email,
                hashed_password=hashed_password,
                role=role_value,  # Guardar directamente el string del valor del enum
                company_id=company_id,  # None si no se proporciona
                is_active=True,  # Activar automáticamente en modo demo
                is_verified=False  # Por defecto no verificado
            )
            logger.info("Usuario creado en memoria, agregando a la sesion...")
            db.add(new_user)
            logger.info("Usuario agregado a la sesion, haciendo commit directamente (sin flush)...")
            # Saltar flush y hacer commit directamente para evitar problemas con relaciones
            try:
                db.commit()
                logger.info("Commit exitoso, refrescando usuario...")
            except Exception as commit_error:
                logger.error(f"Error en commit: {type(commit_error).__name__}: {str(commit_error)}")
                import traceback
                logger.error(traceback.format_exc())
                db.rollback()
                raise
            
            try:
                db.refresh(new_user)
                logger.info(f"Usuario registrado exitosamente: ID={new_user.id}, email={new_user.email}")
            except Exception as refresh_error:
                logger.error(f"Error en refresh: {type(refresh_error).__name__}: {str(refresh_error)}")
                import traceback
                logger.error(traceback.format_exc())
                # No hacer rollback aquí porque el commit ya fue exitoso
                raise
            
            return new_user
        except Exception as db_error:
            logger.error(f"Error al crear usuario en la base de datos: {type(db_error).__name__}")
            logger.error(f"Mensaje: {str(db_error)}")
            import traceback
            logger.error(traceback.format_exc())
            db.rollback()
            raise  # Re-lanzar para que sea capturado por el handler general
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error de validación: {str(e)}"
        )
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        db.rollback()
        error_trace = traceback.format_exc()
        logger.error("=" * 50)
        logger.error("ERROR COMPLETO AL REGISTRAR USUARIO")
        logger.error(f"Tipo de excepcion: {type(e).__name__}")
        logger.error(f"Mensaje: {str(e)}")
        logger.error("Traceback completo:")
        logger.error(error_trace)
        logger.error("=" * 50)
        
        # Incluir más detalles en el error para debugging
        error_detail = f"Error al registrar usuario: {str(e)}"
        if settings.DEBUG:
            error_detail += f" (Tipo: {type(e).__name__})"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Iniciar sesión.
    Retorna tokens de acceso y refresco.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 50)
    logger.info("Iniciando proceso de login")
    logger.info(f"Email: {login_data.email}")
    logger.info("=" * 50)
    
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        logger.warning(f"Usuario no encontrado: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    logger.info(f"Usuario encontrado: ID={user.id}, Email={user.email}, Role={user.role}, Activo={user.is_active}")
    
    if not verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Contraseña incorrecta para usuario: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not user.is_active:
        logger.warning(f"Intento de login de usuario inactivo: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear tokens
    # JWT requiere que "sub" (subject) sea un string, convertir user.id a string
    logger.info("Generando tokens de acceso...")
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "company_id": user.company_id}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    logger.info(f"✅ Login exitoso para usuario: {login_data.email}")
    logger.info("=" * 50)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refrescar token de acceso.
    Valida refresh token y genera nuevo access token.
    """
    from app.core.security import decode_token
    
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido"
        )
    
    user_id_str = payload.get("sub")
    # Convertir user_id de string a int (JWT almacena "sub" como string)
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido"
        )
    user_id = int(user_id_str)
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    # Generar nuevos tokens
    # JWT requiere que "sub" (subject) sea un string, convertir user.id a string
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "company_id": user.company_id}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Obtener información del usuario actual."""
    return current_user


class ChangePasswordRequest(BaseModel):
    """Esquema para cambio de contraseña."""
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual.
    Requiere la contraseña actual para validar.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.hashed_password):
        logger.warning(f"Intento de cambio de contraseña con contraseña incorrecta para usuario: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta"
        )
    
    # Validar que la nueva contraseña sea diferente
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )
    
    # Validar longitud mínima de contraseña
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )
    
    # Actualizar contraseña
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"✅ Contraseña actualizada exitosamente para usuario: {current_user.email}")
    
    return {"message": "Contraseña actualizada exitosamente"}

