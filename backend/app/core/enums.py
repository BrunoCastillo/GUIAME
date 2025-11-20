"""
Enumeraciones para el sistema.
Roles, estados y tipos de documentos.
"""
from enum import Enum


class Role(str, Enum):
    """Roles del sistema."""
    SYSTEM_ADMIN = "system_admin"
    COMPANY_ADMIN = "company_admin"
    INSTRUCTOR = "instructor"
    STUDENT = "student"


class DocumentType(str, Enum):
    """Tipos de documentos soportados."""
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    TXT = "txt"
    VIDEO = "video"
    AUDIO = "audio"


class EventType(str, Enum):
    """Tipos de eventos del calendario."""
    TRAINING = "training"
    MEETING = "meeting"
    EXAM = "exam"
    DEADLINE = "deadline"


class NotificationType(str, Enum):
    """Tipos de notificaciones."""
    MESSAGE = "message"
    ASSIGNMENT = "assignment"
    EVENT = "event"
    SYSTEM = "system"

