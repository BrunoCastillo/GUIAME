"""
Configuración de la base de datos.
Conexión a PostgreSQL con pgvector y sesiones SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear engine de SQLAlchemy
# Usar get_database_url() que maneja Supabase
database_url = settings.get_database_url()
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "sslmode": "require"  # Supabase requiere SSL
    } if "supabase.co" in database_url else {}
)

# Crear sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db():
    """
    Dependencia para obtener sesión de base de datos.
    Generador para manejo automático de cierre de sesión.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

