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
# Configuración optimizada para serverless (pools más pequeños)
database_url = settings.get_database_url()

# Para Supabase Connection Pooling, necesitamos agregar el parámetro project
# Si la URL contiene pooler.supabase.com, agregar options con project ID
connect_args = {}
if "supabase.co" in database_url or "pooler.supabase.com" in database_url:
    connect_args["sslmode"] = "require"
    # Extraer project ID de la URL si está disponible
    # Formato: postgresql://postgres:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?project=PROJECT_ID
    if "pooler.supabase.com" in database_url and "project=" not in database_url:
        # Si no tiene project en la URL, intentar extraerlo del hostname o usar el project ID del .env
        # Por ahora, solo agregar sslmode, el project se puede agregar manualmente en la URL
        pass

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=2,  # Reducido para serverless
    max_overflow=5,  # Reducido para serverless
    pool_recycle=3600,  # Reciclar conexiones cada hora
    connect_args=connect_args
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
    except Exception as e:
        # Rollback en caso de error
        db.rollback()
        print(f"❌ Error en sesión de base de datos: {str(e)}")
        raise
    finally:
        db.close()

