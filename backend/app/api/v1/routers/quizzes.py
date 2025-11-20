"""
Router de evaluaciones y quizzes.
Endpoints para gestión de evaluaciones, preguntas e intentos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.enums import Role
from app.models.quiz import Quiz, Question, Attempt, Answer
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class QuizResponse(BaseModel):
    """Esquema de respuesta de quiz."""
    id: int
    module_id: int
    title: str
    passing_score: float
    total_questions: int
    
    class Config:
        from_attributes = True


class AttemptCreate(BaseModel):
    """Esquema para crear intento."""
    quiz_id: int
    answers: Dict[int, str]  # question_id: answer_text


@router.get("/module/{module_id}", response_model=QuizResponse)
async def get_quiz_by_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener quiz de un módulo."""
    quiz = db.query(Quiz).filter(
        Quiz.module_id == module_id,
        Quiz.is_active == True
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")
    
    return quiz


@router.post("/attempt", status_code=status.HTTP_201_CREATED)
async def submit_attempt(
    attempt_data: AttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enviar intento de evaluación.
    Calcula score y verifica si aprobó (>= 18/20).
    """
    quiz = db.query(Quiz).filter(Quiz.id == attempt_data.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")
    
    # Obtener preguntas
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    
    # Calcular score
    total_points = 0.0
    max_points = sum(q.points for q in questions)
    
    # Crear intento
    attempt = Attempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=0.0
    )
    db.add(attempt)
    db.flush()
    
    # Procesar respuestas
    for question in questions:
        user_answer = attempt_data.answers.get(question.id, "")
        is_correct = user_answer.lower().strip() == question.correct_answer.lower().strip()
        points = question.points if is_correct else 0.0
        
        answer = Answer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer_text=user_answer,
            is_correct=is_correct,
            points_earned=points
        )
        db.add(answer)
        total_points += points
    
    # Calcular score final (sobre 20)
    score = (total_points / max_points) * 20 if max_points > 0 else 0
    attempt.score = score
    attempt.is_passed = score >= quiz.passing_score
    attempt.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(attempt)
    
    return {
        "attempt_id": attempt.id,
        "score": score,
        "is_passed": attempt.is_passed,
        "passing_score": quiz.passing_score
    }

