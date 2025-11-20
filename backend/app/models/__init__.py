"""
Modelos de base de datos.
Importaciones centralizadas de todos los modelos.
"""
from app.models.user import User, Profile
from app.models.company import Company
from app.models.course import Course, Module, ModuleContent, Enrollment
from app.models.quiz import Quiz, Question, Attempt, Answer
from app.models.document import Document
from app.models.chat import ChatMessage, ChatLog
from app.models.event import Event
from app.models.notification import Notification

__all__ = [
    "User",
    "Profile",
    "Company",
    "Course",
    "Module",
    "ModuleContent",
    "Enrollment",
    "Quiz",
    "Question",
    "Attempt",
    "Answer",
    "Document",
    "ChatMessage",
    "ChatLog",
    "Event",
    "Notification",
]

