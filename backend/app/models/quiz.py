"""
Modelos de evaluaciones y cuestionarios.
Gestión de quizzes, preguntas, intentos y respuestas.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Float, Integer as SQLInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Quiz(Base):
    """Modelo de evaluación/quiz."""
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    passing_score = Column(Float, default=18.0)  # 18/20 para aprobar
    total_questions = Column(SQLInteger, default=20)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    module = relationship("Module", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("Attempt", back_populates="quiz")


class Question(Base):
    """Modelo de pregunta dentro de un quiz."""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="multiple_choice")  # multiple_choice, true_false, text
    correct_answer = Column(Text, nullable=False)
    options = Column(Text, nullable=True)  # JSON string para opciones múltiples
    points = Column(Float, default=1.0)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Attempt(Base):
    """Modelo de intento de evaluación."""
    __tablename__ = "attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    is_passed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    user = relationship("User", back_populates="attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    """Modelo de respuesta a pregunta en un intento."""
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    points_earned = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    attempt = relationship("Attempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")

