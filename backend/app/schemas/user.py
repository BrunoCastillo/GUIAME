"""
Esquemas de usuario y autenticación.
Validación de datos de entrada y salida para usuarios.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.core.enums import Role


class UserBase(BaseModel):
    """Esquema base de usuario."""
    email: EmailStr
    role: Role = Role.STUDENT


class UserCreate(UserBase):
    """Esquema para creación de usuario."""
    password: str
    company_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Esquema para actualización de usuario."""
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Esquema de respuesta de usuario."""
    id: int
    company_id: Optional[int]
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProfileBase(BaseModel):
    """Esquema base de perfil."""
    first_name: str
    last_name: str
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None


class ProfileCreate(ProfileBase):
    """Esquema para creación de perfil."""
    user_id: int


class ProfileUpdate(BaseModel):
    """Esquema para actualización de perfil."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class ProfileResponse(ProfileBase):
    """Esquema de respuesta de perfil."""
    id: int
    user_id: int
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Esquema de token de acceso."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Esquema de solicitud de login."""
    email: EmailStr
    password: str

