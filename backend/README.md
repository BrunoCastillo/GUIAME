# Backend - Plataforma de Capacitación

API REST desarrollada con FastAPI para la plataforma de capacitación interactiva multiempresa.

## Características

- **FastAPI** con documentación automática (Swagger/ReDoc)
- **PostgreSQL** con **pgvector** para búsqueda vectorial
- **JWT** para autenticación y autorización
- **Multi-tenant** con aislamiento por empresa
- **RAG** (Retrieval Augmented Generation) con DeepSeek/Ollama
- **ChromaDB** para almacenamiento vectorial
- **Procesamiento de documentos** (PDF, DOCX, PPTX)
- **Sistema de roles** granular

## Requisitos

- Python 3.11+
- PostgreSQL 14+ con extensión pgvector
- Redis (opcional, para cache)
- ChromaDB (opcional, para vector DB externa)

## Instalación

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Configurar base de datos:
```bash
# Crear base de datos PostgreSQL
createdb capacitacion_db

# Ejecutar migraciones
alembic upgrade head
```

5. Ejecutar servidor:
```bash
uvicorn app.main:app --reload
```

La API estará disponible en `http://localhost:8000`
Documentación en `http://localhost:8000/api/docs`

## Estructura del Proyecto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── routers/     # Endpoints de la API
│   ├── core/                 # Configuración y utilidades
│   ├── models/               # Modelos SQLAlchemy
│   ├── schemas/              # Esquemas Pydantic
│   ├── services/             # Lógica de negocio
│   └── utils/                # Utilidades
├── alembic/                  # Migraciones de base de datos
├── uploads/                  # Archivos subidos
└── requirements.txt
```

## Endpoints Principales

- `/api/v1/auth/*` - Autenticación
- `/api/v1/users/*` - Gestión de usuarios
- `/api/v1/companies/*` - Gestión de empresas
- `/api/v1/courses/*` - Gestión de cursos
- `/api/v1/documents/*` - Gestión de documentos
- `/api/v1/chat/*` - Chat tradicional
- `/api/v1/rag/*` - Chat con IA (RAG)
- `/api/v1/events/*` - Calendario de eventos
- `/api/v1/quizzes/*` - Evaluaciones
- `/api/v1/notifications/*` - Notificaciones

## Roles del Sistema

- `system_admin` - Control total sobre todas las empresas
- `company_admin` - Control sobre su empresa
- `instructor` - Gestión de cursos y contenido
- `student` - Consumo de contenido

## Desarrollo

Para ejecutar en modo desarrollo con recarga automática:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
pytest
```

## Licencia

Proyecto privado - Todos los derechos reservados

