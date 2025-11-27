"""
Cliente de Supabase para backend.
Usa Service Key para operaciones administrativas.
"""
from supabase import create_client, Client
from app.core.config import settings
import warnings


def get_supabase_client() -> Client:
    """
    Crear y retornar cliente de Supabase con Service Key.
    
    Returns:
        Cliente de Supabase configurado
    
    Raises:
        ValueError: Si faltan variables de entorno necesarias
    """
    # Validar que las variables de entorno estén configuradas
    if not settings.SUPABASE_URL:
        raise ValueError(
            "❌ SUPABASE_URL no está configurada. "
            "Agrega SUPABASE_URL en tu archivo .env"
        )
    
    if not settings.SUPABASE_SERVICE_KEY:
        raise ValueError(
            "❌ SUPABASE_SERVICE_KEY no está configurada. "
            "Agrega SUPABASE_SERVICE_KEY en tu archivo .env. "
            "⚠️ IMPORTANTE: Service Key solo debe usarse en backend, nunca en frontend."
        )
    
    # Crear cliente con Service Key (para operaciones administrativas)
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )
    
    return supabase


# Cliente global (se crea al importar el módulo)
try:
    supabase = get_supabase_client()
except ValueError as e:
    # En desarrollo, permitir que el cliente no se cree si faltan variables
    # pero mostrar advertencia
    warnings.warn(f"⚠️ Cliente de Supabase no inicializado: {e}")
    supabase = None

