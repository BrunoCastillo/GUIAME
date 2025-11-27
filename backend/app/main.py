"""
Aplicación principal FastAPI para la plataforma de capacitación.
Configuración de la aplicación, middleware, CORS y rutas principales.
"""
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import traceback
import logging
from pathlib import Path

from app.core.config import settings

# Configurar logging para escribir en archivo
# Obtener la ruta absoluta del directorio backend
backend_dir = Path(__file__).parent.parent
log_dir = backend_dir / "logs"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "app.log"

# Configurar el logger solo si no está ya configurado
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8', mode='a'),
            logging.StreamHandler()  # También mostrar en consola
        ]
    )

logger = logging.getLogger(__name__)
logger.info(f"Logging configurado. Archivo de log: {log_file}")
from app.core.database import engine, Base
from app.api.v1 import api_router

# Inicializar rate limiter
limiter = Limiter(key_func=get_remote_address)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Plataforma de Capacitación Interactiva Multiempresa",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configurar rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configurar CORS - Permitir todos los orígenes en desarrollo
# IMPORTANTE: En desarrollo, permitir todos los orígenes para facilitar el desarrollo
if settings.DEBUG or settings.ENVIRONMENT == "development":
    # En desarrollo, permitir todos los orígenes de localhost
    cors_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ]
else:
    # En producción, usar solo los orígenes especificados
    cors_origins = settings.CORS_ORIGINS

# Configurar CORS ANTES de otros middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,  # False para permitir más flexibilidad
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Middleware para asegurar que todas las respuestas sean JSON
@app.middleware("http")
async def ensure_json_response(request: Request, call_next):
    """Middleware para asegurar que todas las respuestas tengan content-type JSON."""
    try:
        response = await call_next(request)
        # Si la respuesta es un error (status >= 400) y tiene content-type text/plain, forzar JSON
        content_type = response.headers.get("content-type", "")
        if response.status_code >= 400 and "text/plain" in content_type:
            # Leer el cuerpo de la respuesta usando response.body si está disponible
            try:
                # Para respuestas de Starlette, necesitamos leer el body de manera diferente
                if hasattr(response, 'body'):
                    error_text = response.body.decode("utf-8") if isinstance(response.body, bytes) else str(response.body)
                else:
                    # Si no tiene body, usar el status text
                    error_text = "Internal Server Error"
                
                print(f"[WARNING] Respuesta text/plain detectada, convirtiendo a JSON: {error_text[:100]}")
                return JSONResponse(
                    status_code=response.status_code,
                    content={"detail": error_text}
                )
            except Exception as e:
                print(f"[WARNING] Error al convertir respuesta a JSON: {e}")
                # Si falla, devolver error genérico en JSON
                return JSONResponse(
                    status_code=response.status_code,
                    content={"detail": "Error en el servidor"}
                )
        return response
    except Exception as e:
        # Si hay un error en el middleware, devolver JSON
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error en middleware: {error_trace}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Error en middleware: {str(e)}"}
        )

# Middleware de seguridad - Deshabilitar en desarrollo para evitar problemas con CORS
# En desarrollo, no usar TrustedHostMiddleware para evitar conflictos con CORS
if not (settings.DEBUG or settings.ENVIRONMENT == "development"):
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Handler para errores de validación (debe ir ANTES del handler general)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para errores de validación de Pydantic."""
    print(f"❌ Error de validación: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body}
    )

# Handler para HTTPException (debe ir ANTES del handler general)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler para HTTPException - asegurar que siempre devuelva JSON con detalle."""
    print(f"❌ HTTPException: {exc.status_code} - {exc.detail}")
    # Si el detail es una lista o dict, devolverlo directamente
    # Si es un string, devolverlo en el formato estándar
    if isinstance(exc.detail, (list, dict)):
        detail = exc.detail
    else:
        detail = str(exc.detail) if exc.detail else "Error en la solicitud"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail}
    )

# Handler global de excepciones para asegurar que siempre se devuelva JSON
# Este debe ir DESPUÉS de los handlers específicos
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global para capturar todas las excepciones y devolver JSON."""
    error_trace = traceback.format_exc()
    print(f"❌ Error no manejado: {error_trace}")
    print(f"❌ Tipo de error: {type(exc).__name__}")
    print(f"❌ Mensaje: {str(exc)}")
    
    # Asegurar que siempre devolvemos JSON
    try:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": f"Error interno del servidor: {str(exc)}",
                "type": type(exc).__name__,
                "traceback": error_trace if settings.DEBUG else None
            }
        )
    except Exception as e:
        # Si incluso esto falla, devolver un JSON mínimo
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Error interno del servidor"}
        )

# Incluir routers
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Eventos de inicio de la aplicación."""
    # En Vercel/serverless, no crear tablas automáticamente
    # Las tablas deben crearse con migraciones de Alembic
    # Base.metadata.create_all(bind=engine)  # Comentado para serverless
    pass


@app.get("/")
async def root():
    """Endpoint raíz de la API."""
    return {
        "message": "Plataforma de Capacitación API",
        "version": settings.VERSION,
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud."""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

