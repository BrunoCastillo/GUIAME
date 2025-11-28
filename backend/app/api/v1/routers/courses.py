"""
Router de cursos.
Endpoints para gestión de cursos, módulos y contenidos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.enums import Role
from app.models.course import Course, Module, ModuleContent, Enrollment
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class CourseBase(BaseModel):
    """Esquema base de curso."""
    title: str
    description: str = None


class CourseCreate(CourseBase):
    """Esquema para creación de curso."""
    instructor_id: Optional[int] = None  # Opcional, se usa el usuario actual si no se proporciona


class CourseResponse(CourseBase):
    """Esquema de respuesta de curso."""
    id: int
    company_id: int
    instructor_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(require_role([Role.COMPANY_ADMIN, Role.PROFESOR, Role.ADMINISTRADOR])),
    db: Session = Depends(get_db)
):
    """
    Crear nuevo curso.
    Si el usuario es profesor, se usa automáticamente como instructor.
    Si es admin, puede especificar otro instructor_id.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Determinar instructor_id
    # Si es profesor, usar su propio ID
    # Si es admin y no especifica instructor_id, usar su propio ID
    instructor_id = course_data.instructor_id
    if not instructor_id:
        instructor_id = current_user.id
        logger.info(f"Usando instructor_id automático: {instructor_id} (usuario actual)")
    else:
        # Si especifica instructor_id, verificar que sea válido
        instructor = db.query(User).filter(User.id == instructor_id).first()
        if not instructor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instructor no encontrado"
            )
        # Verificar que el instructor pertenezca a la misma empresa (si no es admin del sistema)
        if current_user.role != Role.ADMINISTRADOR.value and instructor.company_id != current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El instructor debe pertenecer a la misma empresa"
            )
    
    # Crear curso
    course_dict = course_data.dict()
    course_dict['instructor_id'] = instructor_id
    
    # Asignar company_id: usar el del usuario
    company_id = current_user.company_id
    
    # Si el usuario no tiene company_id, intentar obtener o crear una empresa por defecto
    if company_id is None:
        logger.warning(f"⚠️ Usuario sin company_id intentando crear curso: ID={current_user.id}, Role={current_user.role}")
        
        # Si es administrador, buscar la primera empresa activa o crear una por defecto
        if current_user.role == Role.ADMINISTRADOR.value:
            from app.models.company import Company
            # Buscar primera empresa activa
            default_company = db.query(Company).filter(Company.is_active == True).first()
            if default_company:
                company_id = default_company.id
                logger.info(f"✅ Usando empresa por defecto: ID={company_id}")
            else:
                # Crear empresa por defecto para administradores
                default_company = Company(
                    name="Empresa Principal",
                    description="Empresa por defecto del sistema",
                    is_active=True
                )
                db.add(default_company)
                db.commit()
                db.refresh(default_company)
                company_id = default_company.id
                logger.info(f"✅ Creada empresa por defecto: ID={company_id}")
        else:
            # Para otros roles, requerir company_id
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario debe tener una empresa asignada para crear cursos. Contacte al administrador."
            )
    
    course_dict['company_id'] = company_id
    
    new_course = Course(**course_dict)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    logger.info(f"✅ Curso creado: ID={new_course.id}, Título={new_course.title}, Instructor={instructor_id}, Company={company_id}")
    
    return new_course


@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar cursos disponibles para el usuario.
    - Administradores: ven todos los cursos
    - Estudiantes sin company_id: ven todos los cursos activos (pueden inscribirse)
    - Otros roles: ven cursos de su empresa
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔍 Listando cursos para usuario: ID={current_user.id}, Role={current_user.role}, Company_ID={current_user.company_id}")
    
    # Si es administrador del sistema, puede ver todos los cursos
    if current_user.role == Role.ADMINISTRADOR.value:
        courses = db.query(Course).filter(
            Course.is_active == True
        ).offset(skip).limit(limit).all()
        logger.info(f"✅ Administrador: retornando {len(courses)} cursos (todos)")
    elif current_user.role == Role.ESTUDIANTE.value:
        # Estudiantes pueden ver todos los cursos activos, incluso sin company_id
        # Esto les permite inscribirse en cualquier curso disponible
        if current_user.company_id is None:
            logger.info(f"📚 Estudiante sin company_id: mostrando todos los cursos activos")
            courses = db.query(Course).filter(
                Course.is_active == True
            ).offset(skip).limit(limit).all()
            logger.info(f"✅ Estudiante sin company_id: retornando {len(courses)} cursos (todos los activos)")
        else:
            # Si tiene company_id, mostrar cursos de su empresa y también todos los activos
            # para dar más opciones
            courses = db.query(Course).filter(
                Course.is_active == True
            ).offset(skip).limit(limit).all()
            logger.info(f"✅ Estudiante con company_id {current_user.company_id}: retornando {len(courses)} cursos (todos los activos)")
    else:
        # Para otros roles (profesor, company_admin), filtrar por company_id
        if current_user.company_id is None:
            logger.warning(f"⚠️ Usuario sin company_id: ID={current_user.id}, Role={current_user.role}")
            # Si no tiene company_id, retornar lista vacía
            courses = []
            logger.info(f"✅ Usuario sin company_id: retornando lista vacía")
        else:
            courses = db.query(Course).filter(
                Course.company_id == current_user.company_id,
                Course.is_active == True
            ).offset(skip).limit(limit).all()
            logger.info(f"✅ Usuario con company_id {current_user.company_id}: retornando {len(courses)} cursos")
    
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener curso por ID."""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔍 Obteniendo curso: ID={course_id}, Usuario={current_user.id}, Company={current_user.company_id}")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        logger.warning(f"❌ Curso no encontrado: ID={course_id}")
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Si es administrador, puede ver cualquier curso
    if current_user.role == Role.ADMINISTRADOR.value:
        logger.info(f"✅ Administrador: acceso permitido al curso {course_id}")
        return course
    
    # Estudiantes pueden ver cualquier curso activo, incluso sin company_id
    if current_user.role == Role.ESTUDIANTE.value:
        if not course.is_active:
            logger.warning(f"❌ Estudiante intentando acceder a curso inactivo: ID={course_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El curso no está disponible"
            )
        logger.info(f"✅ Estudiante accediendo al curso {course_id} (company_id={current_user.company_id})")
        return course
    
    # Para otros roles (profesor, company_admin), verificar company_id
    if current_user.company_id is None:
        logger.warning(f"⚠️ Usuario sin company_id intentando acceder al curso {course_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este curso. Su usuario no tiene una empresa asignada."
        )
    
    if course.company_id != current_user.company_id:
        logger.warning(f"❌ Acceso denegado: Curso company={course.company_id}, Usuario company={current_user.company_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este curso"
        )
    
    logger.info(f"✅ Acceso permitido al curso {course_id}")
    return course


@router.post("/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Inscribirse a un curso.
    Los estudiantes pueden inscribirse en cualquier curso activo, incluso sin company_id.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"📝 Usuario {current_user.id} (Role={current_user.role}) intentando inscribirse en curso {course_id}")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        logger.warning(f"❌ Curso no encontrado: ID={course_id}")
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if not course.is_active:
        logger.warning(f"❌ Intento de inscripción en curso inactivo: ID={course_id}")
        raise HTTPException(status_code=400, detail="El curso no está disponible")
    
    # Verificar si ya está inscrito
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if existing:
        logger.warning(f"⚠️ Usuario {current_user.id} ya está inscrito en curso {course_id}")
        raise HTTPException(status_code=400, detail="Ya está inscrito en este curso")
    
    # Permitir inscripción incluso si el estudiante no tiene company_id
    # o si el curso pertenece a otra empresa (para flexibilidad)
    enrollment = Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    
    logger.info(f"✅ Usuario {current_user.id} inscrito exitosamente en curso {course_id}")
    
    return {"message": "Inscripción exitosa"}


@router.get("/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener los cursos en los que el usuario está inscrito.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"📚 Obteniendo cursos inscritos para usuario: ID={current_user.id}, Role={current_user.role}")
    
    # Obtener los enrollments del usuario
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    
    # Extraer los IDs de los cursos
    course_ids = [enrollment.course_id for enrollment in enrollments]
    
    if not course_ids:
        logger.info(f"✅ Usuario {current_user.id} no tiene cursos inscritos")
        return []
    
    # Obtener los cursos
    courses = db.query(Course).filter(
        Course.id.in_(course_ids),
        Course.is_active == True
    ).all()
    
    logger.info(f"✅ Usuario {current_user.id} tiene {len(courses)} cursos inscritos")
    
    return courses

