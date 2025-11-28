"""
Router de cursos.
Endpoints para gestión de cursos, módulos y contenidos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
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
        
        from app.models.company import Company
        
        # Si es administrador o profesor, buscar la primera empresa activa o crear una por defecto
        if current_user.role == Role.ADMINISTRADOR.value or current_user.role == Role.PROFESOR.value:
            # Buscar primera empresa activa
            default_company = db.query(Company).filter(Company.is_active == True).first()
            if default_company:
                company_id = default_company.id
                logger.info(f"✅ Usando empresa por defecto: ID={company_id}")
            else:
                # Crear empresa por defecto para administradores y profesores
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
            # Para otros roles (company_admin), requerir company_id
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
    elif current_user.role == Role.PROFESOR.value:
        # Profesores pueden ver:
        # 1. Cursos donde son instructores (instructor_id)
        # 2. Cursos de su empresa (si tienen company_id)
        if current_user.company_id is None:
            # Si no tiene company_id, mostrar solo cursos donde es instructor
            logger.info(f"👨‍🏫 Profesor sin company_id: mostrando cursos donde es instructor")
            courses = db.query(Course).filter(
                Course.instructor_id == current_user.id,
                Course.is_active == True
            ).offset(skip).limit(limit).all()
            logger.info(f"✅ Profesor sin company_id: retornando {len(courses)} cursos (donde es instructor)")
        else:
            # Si tiene company_id, mostrar cursos de su empresa Y cursos donde es instructor
            logger.info(f"👨‍🏫 Profesor con company_id {current_user.company_id}: mostrando cursos de empresa e instructor")
            courses = db.query(Course).filter(
                or_(
                    Course.company_id == current_user.company_id,
                    Course.instructor_id == current_user.id
                ),
                Course.is_active == True
            ).offset(skip).limit(limit).all()
            logger.info(f"✅ Profesor con company_id: retornando {len(courses)} cursos")
    else:
        # Para otros roles (company_admin), filtrar por company_id
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
    
    # Profesores pueden ver cursos donde son instructores
    if current_user.role == Role.PROFESOR.value:
        if course.instructor_id == current_user.id:
            logger.info(f"✅ Profesor accediendo al curso {course_id} (es instructor)")
            return course
        # Si no es instructor, verificar company_id
        if current_user.company_id is None:
            logger.warning(f"⚠️ Profesor sin company_id intentando acceder al curso {course_id} (no es instructor)")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a este curso. No es el instructor y no tiene empresa asignada."
            )
        if course.company_id == current_user.company_id:
            logger.info(f"✅ Profesor accediendo al curso {course_id} (misma empresa)")
            return course
        logger.warning(f"❌ Profesor sin acceso: Curso company={course.company_id}, Usuario company={current_user.company_id}, Instructor={course.instructor_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a este curso"
        )
    
    # Para otros roles (company_admin), verificar company_id
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


# ==================== MÓDULOS (TEMAS) ====================

class ModuleBase(BaseModel):
    """Esquema base de módulo."""
    title: str
    description: Optional[str] = None
    order: int = 0


class ModuleCreate(ModuleBase):
    """Esquema para creación de módulo."""
    pass


class ModuleUpdate(BaseModel):
    """Esquema para actualización de módulo."""
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class ModuleResponse(ModuleBase):
    """Esquema de respuesta de módulo."""
    id: int
    course_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.get("/{course_id}/modules", response_model=List[ModuleResponse])
async def get_course_modules(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener todos los módulos (temas) de un curso.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"📚 Obteniendo módulos del curso {course_id}")
    
    # Verificar que el curso existe y el usuario tiene acceso
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        logger.warning(f"❌ Curso no encontrado: ID={course_id}")
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar permisos de acceso al curso
    if current_user.role == Role.ADMINISTRADOR.value:
        pass  # Administradores pueden ver cualquier curso
    elif current_user.role == Role.ESTUDIANTE.value:
        if not course.is_active:
            raise HTTPException(status_code=403, detail="El curso no está disponible")
    elif current_user.role == Role.PROFESOR.value:
        # Profesores pueden ver cursos donde son instructores
        if course.instructor_id == current_user.id:
            logger.info(f"✅ Profesor accediendo a módulos del curso {course_id} (es instructor)")
        elif current_user.company_id is None:
            logger.warning(f"⚠️ Profesor sin company_id intentando acceder a módulos del curso {course_id} (no es instructor)")
            raise HTTPException(status_code=403, detail="No tiene permisos para acceder a este curso. No es el instructor y no tiene empresa asignada.")
        elif course.company_id != current_user.company_id:
            logger.warning(f"❌ Profesor sin acceso a módulos: Curso company={course.company_id}, Usuario company={current_user.company_id}")
            raise HTTPException(status_code=403, detail="No tiene permisos para acceder a este curso")
        else:
            logger.info(f"✅ Profesor accediendo a módulos del curso {course_id} (misma empresa)")
    else:
        # Para otros roles (company_admin), verificar company_id
        if current_user.company_id is None or course.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="No tiene permisos para acceder a este curso")
    
    # Obtener módulos ordenados por order
    modules = db.query(Module).filter(
        Module.course_id == course_id
    ).order_by(Module.order.asc()).all()
    
    logger.info(f"✅ Retornando {len(modules)} módulos del curso {course_id}")
    
    return modules


@router.post("/{course_id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    course_id: int,
    module_data: ModuleCreate,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo módulo (tema) en un curso.
    Solo profesores, administradores y company_admin pueden crear módulos.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"➕ Creando módulo en curso {course_id}: {module_data.title}")
    
    # Verificar que el curso existe
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        logger.warning(f"❌ Curso no encontrado: ID={course_id}")
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar permisos: solo el instructor o administradores pueden crear módulos
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            # Verificar también si es company_admin de la misma empresa
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                logger.warning(f"❌ Usuario {current_user.id} no tiene permisos para crear módulos en curso {course_id}")
                raise HTTPException(
                    status_code=403,
                    detail="Solo el instructor del curso o administradores pueden crear módulos"
                )
    
    # Crear módulo
    module_dict = module_data.dict()
    module_dict['course_id'] = course_id
    
    new_module = Module(**module_dict)
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    
    logger.info(f"✅ Módulo creado: ID={new_module.id}, Título={new_module.title}")
    
    return new_module


@router.get("/{course_id}/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    course_id: int,
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener un módulo específico.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    module = db.query(Module).filter(
        Module.id == module_id,
        Module.course_id == course_id
    ).first()
    
    if not module:
        logger.warning(f"❌ Módulo no encontrado: ID={module_id} en curso {course_id}")
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    # Verificar acceso al curso
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role == Role.ADMINISTRADOR.value:
        pass
    elif current_user.role == Role.ESTUDIANTE.value:
        if not course.is_active or not module.is_active:
            raise HTTPException(status_code=403, detail="El módulo no está disponible")
    else:
        if current_user.company_id is None or course.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="No tiene permisos")
    
    return module


@router.put("/{course_id}/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    course_id: int,
    module_id: int,
    module_update: ModuleUpdate,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Actualizar un módulo.
    Solo el instructor del curso o administradores pueden actualizar módulos.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"✏️ Actualizando módulo {module_id} del curso {course_id}")
    
    module = db.query(Module).filter(
        Module.id == module_id,
        Module.course_id == course_id
    ).first()
    
    if not module:
        logger.warning(f"❌ Módulo no encontrado: ID={module_id}")
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    # Verificar permisos
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para actualizar este módulo")
    
    # Actualizar campos
    update_data = module_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(module, key, value)
    
    db.commit()
    db.refresh(module)
    
    logger.info(f"✅ Módulo actualizado: ID={module_id}")
    
    return module


@router.delete("/{course_id}/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    course_id: int,
    module_id: int,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Eliminar un módulo.
    Solo el instructor del curso o administradores pueden eliminar módulos.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🗑️ Eliminando módulo {module_id} del curso {course_id}")
    
    module = db.query(Module).filter(
        Module.id == module_id,
        Module.course_id == course_id
    ).first()
    
    if not module:
        logger.warning(f"❌ Módulo no encontrado: ID={module_id}")
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    # Verificar permisos
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este módulo")
    
    # Eliminar módulo (cascade eliminará los contenidos)
    db.delete(module)
    db.commit()
    
    logger.info(f"✅ Módulo eliminado: ID={module_id}")
    
    return None


# ==================== CONTENIDO DE MÓDULOS ====================

class ModuleContentBase(BaseModel):
    """Esquema base de contenido de módulo."""
    content_type: str  # 'text', 'video', 'document', 'link'
    content: Optional[str] = None
    document_id: Optional[int] = None
    order: int = 0


class ModuleContentCreate(ModuleContentBase):
    """Esquema para creación de contenido."""
    pass


class ModuleContentUpdate(BaseModel):
    """Esquema para actualización de contenido."""
    content_type: Optional[str] = None
    content: Optional[str] = None
    document_id: Optional[int] = None
    order: Optional[int] = None


class ModuleContentResponse(ModuleContentBase):
    """Esquema de respuesta de contenido."""
    id: int
    module_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/modules/{module_id}/contents", response_model=List[ModuleContentResponse])
async def get_module_contents(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener todo el contenido de un módulo.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"📄 Obteniendo contenido del módulo {module_id}")
    
    # Verificar que el módulo existe
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        logger.warning(f"❌ Módulo no encontrado: ID={module_id}")
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    # Verificar acceso al curso
    course = db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role == Role.ADMINISTRADOR.value:
        pass
    elif current_user.role == Role.ESTUDIANTE.value:
        if not course.is_active or not module.is_active:
            raise HTTPException(status_code=403, detail="El contenido no está disponible")
    else:
        if current_user.company_id is None or course.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="No tiene permisos")
    
    # Obtener contenidos ordenados por order
    contents = db.query(ModuleContent).filter(
        ModuleContent.module_id == module_id
    ).order_by(ModuleContent.order.asc()).all()
    
    logger.info(f"✅ Retornando {len(contents)} contenidos del módulo {module_id}")
    
    return contents


@router.post("/modules/{module_id}/contents", response_model=ModuleContentResponse, status_code=status.HTTP_201_CREATED)
async def create_module_content(
    module_id: int,
    content_data: ModuleContentCreate,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Crear nuevo contenido en un módulo.
    Solo profesores, administradores y company_admin pueden crear contenido.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"➕ Creando contenido en módulo {module_id}: tipo={content_data.content_type}")
    
    # Verificar que el módulo existe
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        logger.warning(f"❌ Módulo no encontrado: ID={module_id}")
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    # Verificar permisos
    course = db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para crear contenido")
    
    # Validar content_type
    valid_types = ['text', 'video', 'document', 'link']
    if content_data.content_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"content_type debe ser uno de: {', '.join(valid_types)}"
        )
    
    # Crear contenido
    content_dict = content_data.dict()
    content_dict['module_id'] = module_id
    
    new_content = ModuleContent(**content_dict)
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    
    logger.info(f"✅ Contenido creado: ID={new_content.id}, Tipo={new_content.content_type}")
    
    return new_content


@router.get("/modules/{module_id}/contents/{content_id}", response_model=ModuleContentResponse)
async def get_module_content(
    module_id: int,
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener un contenido específico.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    content = db.query(ModuleContent).filter(
        ModuleContent.id == content_id,
        ModuleContent.module_id == module_id
    ).first()
    
    if not content:
        logger.warning(f"❌ Contenido no encontrado: ID={content_id}")
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    
    # Verificar acceso
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    course = db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role == Role.ADMINISTRADOR.value:
        pass
    elif current_user.role == Role.ESTUDIANTE.value:
        if not course.is_active or not module.is_active:
            raise HTTPException(status_code=403, detail="El contenido no está disponible")
    else:
        if current_user.company_id is None or course.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="No tiene permisos")
    
    return content


@router.put("/modules/{module_id}/contents/{content_id}", response_model=ModuleContentResponse)
async def update_module_content(
    module_id: int,
    content_id: int,
    content_update: ModuleContentUpdate,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Actualizar contenido de un módulo.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"✏️ Actualizando contenido {content_id} del módulo {module_id}")
    
    content = db.query(ModuleContent).filter(
        ModuleContent.id == content_id,
        ModuleContent.module_id == module_id
    ).first()
    
    if not content:
        logger.warning(f"❌ Contenido no encontrado: ID={content_id}")
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    
    # Verificar permisos
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    course = db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para actualizar este contenido")
    
    # Validar content_type si se actualiza
    if content_update.content_type:
        valid_types = ['text', 'video', 'document', 'link']
        if content_update.content_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"content_type debe ser uno de: {', '.join(valid_types)}"
            )
    
    # Actualizar campos
    update_data = content_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(content, key, value)
    
    db.commit()
    db.refresh(content)
    
    logger.info(f"✅ Contenido actualizado: ID={content_id}")
    
    return content


@router.delete("/modules/{module_id}/contents/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module_content(
    module_id: int,
    content_id: int,
    current_user: User = Depends(require_role([Role.PROFESOR, Role.ADMINISTRADOR, Role.COMPANY_ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Eliminar contenido de un módulo.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🗑️ Eliminando contenido {content_id} del módulo {module_id}")
    
    content = db.query(ModuleContent).filter(
        ModuleContent.id == content_id,
        ModuleContent.module_id == module_id
    ).first()
    
    if not content:
        logger.warning(f"❌ Contenido no encontrado: ID={content_id}")
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    
    # Verificar permisos
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    
    course = db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    if current_user.role != Role.ADMINISTRADOR.value:
        if course.instructor_id != current_user.id:
            if current_user.role != Role.COMPANY_ADMIN.value or course.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este contenido")
    
    # Eliminar contenido
    db.delete(content)
    db.commit()
    
    logger.info(f"✅ Contenido eliminado: ID={content_id}")
    
    return None


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

