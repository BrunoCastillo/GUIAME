"""
Router de documentos.
Endpoints para carga, procesamiento y gestión de documentos.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.document import Document
from app.models.user import User
from app.core.enums import DocumentType
from pydantic import BaseModel
from datetime import datetime
import os
from app.core.config import settings

router = APIRouter()


class DocumentResponse(BaseModel):
    """Esquema de respuesta de documento."""
    id: int
    company_id: int
    title: str
    file_type: DocumentType
    file_size: int
    is_processed: bool
    is_indexed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Subir documento.
    Guarda archivo y crea registro en base de datos.
    """
    # Validar extensión
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Permitidos: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Validar tamaño
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo muy grande. Máximo: {settings.MAX_FILE_SIZE} bytes"
        )
    
    # Guardar archivo
    file_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.company_id}_{file.filename}")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Crear registro
    document = Document(
        company_id=current_user.company_id,
        title=file.filename,
        file_path=file_path,
        file_type=DocumentType(file_ext),
        file_size=len(contents),
        uploaded_by=current_user.id
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # TODO: Procesar documento en background (worker)
    
    return document


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar documentos de la empresa."""
    documents = db.query(Document).filter(
        Document.company_id == current_user.company_id
    ).offset(skip).limit(limit).all()
    
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener documento por ID."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if document.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    return document

