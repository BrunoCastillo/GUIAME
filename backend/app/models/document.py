"""
Modelo de documentos.
Gestión de documentos, procesamiento y embeddings.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import DocumentType


class Document(Base):
    """Modelo de documento procesado."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(SQLEnum(DocumentType), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    is_processed = Column(Boolean, default=False)
    is_indexed = Column(Boolean, default=False)  # Si tiene embeddings en vector DB
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    company = relationship("Company", back_populates="documents")
    module_contents = relationship("ModuleContent", back_populates="document")

