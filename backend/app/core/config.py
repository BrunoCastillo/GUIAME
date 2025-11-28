"""
Configuración centralizada de la aplicación.
Manejo de variables de entorno y configuración global.
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    """Configuración de la aplicación desde variables de entorno."""
    
    # Aplicación
    PROJECT_NAME: str = "Plataforma de Capacitación"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Base de datos (Supabase)
    # Usar DATABASE_URL completa o las variables individuales
    DATABASE_URL: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    POSTGRES_HOST: str = ""
    POSTGRES_PORT: int = 5432
    
    def get_database_url(self) -> str:
        """Obtener URL de base de datos, construyéndola si es necesario."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            # Para Supabase, corregir hostname y agregar sslmode=require si no está presente
            if "supabase.co" in url or "supabase.com" in url:
                # Eliminar el prefijo "db." del hostname si está presente
                # El hostname correcto es: gatwolhwmiaqqnjuszuh.supabase.co (sin db.)
                import re
                url = re.sub(r'@db\.([^.]+\.supabase\.co)', r'@\1', url)
                
                # Eliminar parámetros no reconocidos por psycopg2 (como pgbouncer)
                # Estos parámetros causan errores de conexión
                url = re.sub(r'[?&]pgbouncer=[^&]*', '', url)
                url = re.sub(r'[?&]options=[^&]*', '', url)
                
                if "sslmode=" not in url:
                    separator = "&" if "?" in url else "?"
                    url = f"{url}{separator}sslmode=require"
            
            # Para Supabase Connection Pooling, el nombre de usuario debe incluir el project ID
            # Formato: postgres.PROJECT_ID en lugar de solo postgres
            if "pooler.supabase.com" in url:
                project_id = "gatwolhwmiaqqnjuszuh"  # Project ID conocido
                
                # Extraer project ID de la URL si está presente en options
                if "options=-cproject" in url:
                    import urllib.parse
                    # Decodificar URL para extraer project ID
                    if "options=-cproject%3D" in url:
                        project_id = urllib.parse.unquote(url.split("options=-cproject%3D")[1].split("&")[0].split("?")[0])
                    elif "options=-cproject=" in url:
                        project_id = url.split("options=-cproject=")[1].split("&")[0].split("?")[0]
                
                # Verificar si el usuario ya tiene el project ID como sufijo
                # Formato esperado: postgres.PROJECT_ID@
                import re
                if f"postgres.{project_id}@" not in url and f"postgres.{project_id}:" not in url:
                    # Reemplazar postgres: o postgres@ con postgres.PROJECT_ID
                    url = re.sub(r'postgres([+:]?[^:]*)?([:@])', f'postgres.{project_id}\\2', url, count=1)
            return url
        # Construir URL desde variables individuales
        if all([self.POSTGRES_USER, self.POSTGRES_PASSWORD, self.POSTGRES_HOST, self.POSTGRES_DB]):
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        raise ValueError("Debe proporcionar DATABASE_URL o todas las variables POSTGRES_*")
    
    # Seguridad
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # AI Services
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OPENAI_API_KEY: str = ""
    
    # ChromaDB
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8000
    CHROMADB_COLLECTION: str = "capacitacion_docs"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Google Drive
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    
    # CORS - Permitir cualquier puerto de localhost para desarrollo
    # En producción, se debe configurar como variable de entorno separada por comas
    # Ejemplo: CORS_ORIGINS=https://tu-frontend.vercel.app,https://tu-dominio.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ]
    # En desarrollo, permitir todos los orígenes de localhost
    # En producción, especificar los orígenes exactos
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 104857600  # 100MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "pptx", "txt", "mp4", "mp3"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignorar campos extra en .env que no están definidos en el modelo


# Crear directorio de uploads si no existe
settings = Settings()
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

