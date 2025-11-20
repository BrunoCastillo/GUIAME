"""
Modelos de usuario y perfil.
Gestión de usuarios, autenticación y perfiles extendidos.
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import Role


class User(Base):
    """Modelo de usuario para autenticación."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(Role), nullable=False, default=Role.STUDENT)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    profile = relationship("Profile", back_populates="user", uselist=False)
    company = relationship("Company", back_populates="users")
    enrollments = relationship("Enrollment", back_populates="user")
    attempts = relationship("Attempt", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    events = relationship("Event", back_populates="user")


class Profile(Base):
    """Modelo de perfil extendido del usuario."""
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=True)
    department = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="profile")

