# Plataforma de Capacitación Interactiva Multiempresa

Plataforma completa de capacitación con chat IA, gestión de cursos, documentos y sistema multiempresa.

## Estructura del Proyecto

El proyecto está dividido en dos partes independientes:

- **Backend** (`/backend`) - API REST con FastAPI
- **Frontend** (`/frontend`) - Aplicación web con React + TypeScript

## Características Principales

### Backend
- ✅ API REST con FastAPI
- ✅ Autenticación JWT
- ✅ Sistema multi-tenant (multiempresa)
- ✅ Roles y permisos granulares
- ✅ Procesamiento de documentos (PDF, DOCX, PPTX)
- ✅ RAG (Retrieval Augmented Generation) con DeepSeek/Ollama
- ✅ Búsqueda vectorial con pgvector (Supabase)
- ✅ Supabase como base de datos PostgreSQL
- ✅ Documentación automática (Swagger/ReDoc)

### Frontend
- ✅ React 18 + TypeScript
- ✅ Vite para desarrollo rápido
- ✅ Tailwind CSS para estilos
- ✅ Zustand para gestión de estado
- ✅ React Router para navegación
- ✅ Diseño responsive
- ✅ Chat tradicional y con IA
- ✅ Dashboard personalizado por rol

## Inicio Rápido

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.11+** (verificar con `python --version`)
- **Node.js 18+** (verificar con `node --version`)
- **Cuenta de Supabase** (gratuita) - [Crear cuenta](https://supabase.com)
- **npm** o **yarn**

**Nota:** Este proyecto usa **Supabase** como base de datos, que incluye PostgreSQL con pgvector ya configurado. No necesitas instalar PostgreSQL localmente.

### Backend

#### 1. Configurar entorno virtual

```bash
cd backend
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Linux/Mac:
source venv/bin/activate
```

#### 2. Actualizar pip e instalar dependencias

```bash
# Actualizar pip a la última versión
pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt
```

**Nota:** Si encuentras conflictos de dependencias, pip intentará resolverlos automáticamente. Las versiones en `requirements.txt` están configuradas para ser compatibles.

#### 3. Configurar Supabase

1. **Crear proyecto en Supabase:**
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta o inicia sesión
   - Crea un nuevo proyecto
   - Espera a que se complete el setup (2-3 minutos)

2. **Obtener credenciales de conexión:**
   - En tu proyecto de Supabase, ve a **Settings > Database**
   - Copia la **Connection string** (URI)
   - También copia:
     - **Project URL** (SUPABASE_URL)
     - **anon/public key** (SUPABASE_KEY)
     - **service_role key** (SUPABASE_SERVICE_KEY)

3. **Habilitar extensión pgvector (ya viene habilitada):**
   - Ve a **Database > Extensions** en el dashboard de Supabase
   - Verifica que `vector` esté habilitada (debería estarlo por defecto)
   - Si no, haz clic en "Enable" en la extensión `vector`

#### 4. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de Supabase
```

**Variables mínimas requeridas en `.env`:**

```env
# URL de conexión de Supabase (desde Settings > Database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# O usar variables individuales:
POSTGRES_HOST=db.tu-proyecto.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password-supabase
POSTGRES_DB=postgres
POSTGRES_PORT=5432

# URL y keys de Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_KEY=tu-supabase-service-key

# Clave secreta para JWT (generar con: openssl rand -hex 32)
SECRET_KEY=tu-clave-secreta-muy-segura-aqui
```

**Cómo obtener las credenciales:**
- `DATABASE_URL`: Settings > Database > Connection string > URI
- `SUPABASE_URL`: Settings > API > Project URL
- `SUPABASE_KEY`: Settings > API > Project API keys > anon/public
- `SUPABASE_SERVICE_KEY`: Settings > API > Project API keys > service_role

#### 5. Ejecutar migraciones

```bash
# Crear migración inicial
alembic revision --autogenerate -m "Initial migration"

# Aplicar migraciones a Supabase
alembic upgrade head
```

**Nota:** Las migraciones se aplicarán directamente a tu base de datos de Supabase. Asegúrate de tener las credenciales correctas en `.env`.

#### 6. Iniciar servidor

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**URLs disponibles:**
- API: `http://localhost:8000`
- Documentación Swagger: `http://localhost:8000/api/docs`
- Documentación ReDoc: `http://localhost:8000/api/redoc`
- Health Check: `http://localhost:8000/health`

### Frontend

#### 1. Instalar dependencias

```bash
cd frontend
npm install
```

#### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con la URL del backend
VITE_API_URL=http://localhost:8000
```

#### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

**Aplicación disponible en:** `http://localhost:5173`

#### 4. Build para producción (opcional)

```bash
npm run build
npm run preview
```

## Requisitos Detallados

### Backend
- **Python 3.11+** - Lenguaje de programación
- **Supabase** - Base de datos PostgreSQL con pgvector incluido
  - PostgreSQL 14+ con extensión pgvector ya configurada
  - No requiere instalación local de PostgreSQL
- **Redis** (opcional) - Para cache y tareas asíncronas
- **ChromaDB** (opcional) - Vector DB externa alternativa

### Frontend
- **Node.js 18+** - Runtime de JavaScript
- **npm 9+** o **yarn 1.22+** - Gestor de paquetes

### Servicios Requeridos
- **Supabase** - Base de datos PostgreSQL con pgvector (requerido)

### Servicios Opcionales
- **DeepSeek API** - Para generación de respuestas IA (recomendado)
- **Ollama** - Para IA local (alternativa a DeepSeek)
- **Redis** - Para cache y tareas asíncronas
- **ChromaDB** - Vector DB externa (alternativa a pgvector)

## Roles del Sistema

- **system_admin** - Control total sobre todas las empresas
- **company_admin** - Control sobre su empresa
- **instructor** - Gestión de cursos y contenido
- **student** - Consumo de contenido

## Configuración de Supabase

### Crear Proyecto en Supabase

1. **Registrarse/Crear cuenta:**
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta gratuita (incluye 500MB de base de datos)

2. **Crear nuevo proyecto:**
   - Haz clic en "New Project"
   - Completa:
     - **Name**: Nombre de tu proyecto
     - **Database Password**: Guarda esta contraseña (no la podrás ver después)
     - **Region**: Elige la más cercana
   - Espera 2-3 minutos mientras se crea el proyecto

3. **Obtener credenciales:**
   - Ve a **Settings > API** en tu proyecto
   - Copia:
     - **Project URL** → `SUPABASE_URL`
     - **anon public** key → `SUPABASE_KEY`
     - **service_role** key → `SUPABASE_SERVICE_KEY` (mantén esto secreto)

4. **Obtener Connection String:**
   - Ve a **Settings > Database**
   - En "Connection string", selecciona "URI"
   - Copia la URL completa → `DATABASE_URL`
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### Verificar Extensión pgvector

1. Ve a **Database > Extensions** en el dashboard
2. Busca `vector` en la lista
3. Verifica que esté habilitada (debería estarlo por defecto)
4. Si no está, haz clic en "Enable"

### Límites del Plan Gratuito

- **500MB** de base de datos
- **2GB** de bandwidth
- **50,000** requests/mes en API
- Proyectos se pausan después de 1 semana de inactividad

Para producción, considera actualizar a un plan de pago.

## Arquitectura

### Modelo Multi-Tenant
- Todas las tablas incluyen `company_id` para aislamiento
- Row Level Security (RLS) por empresa
- JWT con claims de `company_id` y `role`

### RAG Pipeline
1. Usuario hace pregunta
2. Embedding de la pregunta
3. Búsqueda vectorial en documentos indexados
4. Recuperación de top-k fragmentos relevantes
5. Generación de respuesta con DeepSeek/Ollama
6. Retorno de respuesta + fuentes

### Procesamiento de Documentos
1. Usuario sube archivo
2. Extracción de texto (OCR si es necesario)
3. Chunking inteligente
4. Generación de embeddings
5. Indexación en vector DB
6. Disponible para búsqueda RAG

## Despliegue

Este proyecto está configurado para desplegarse en **Vercel**:

- **Frontend**: Se despliega automáticamente desde `/frontend`
- **Backend**: Se despliega como serverless functions desde `/backend`

### Guía de Despliegue Completa

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas sobre:
- Configuración de GitHub
- Despliegue en Vercel
- Configuración de variables de entorno
- CI/CD con GitHub Actions

### Despliegue Rápido

```bash
# Backend
cd backend
vercel --prod

# Frontend
cd frontend
vercel --prod
```

## Documentación

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Guía de Despliegue](./DEPLOYMENT.md)
- [Guía Completa](./Guia_Completa_Plataforma_Capacitacion.md)

## Desarrollo

### Backend

#### Modo desarrollo con recarga automática
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Crear nueva migración
```bash
alembic revision --autogenerate -m "Descripción del cambio"
alembic upgrade head
```

#### Revertir migración
```bash
alembic downgrade -1
```

### Frontend

#### Modo desarrollo
```bash
cd frontend
npm run dev
```

#### Verificar tipos TypeScript
```bash
npm run build  # Ejecuta tsc para verificar tipos
```

#### Linting
```bash
npm run lint
```

## Solución de Problemas

### Conflictos de dependencias en Backend

Si encuentras errores al instalar dependencias:

```bash
# Actualizar pip
pip install --upgrade pip

# Limpiar cache de pip
pip cache purge

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error de conexión a Supabase

1. **Verificar credenciales en `.env`:**
   - Asegúrate de que `DATABASE_URL` tenga el formato correcto
   - Verifica que la contraseña esté correcta (sin caracteres especiales codificados)
   - Si usas variables individuales, verifica que todas estén completas

2. **Verificar que el proyecto de Supabase esté activo:**
   - Ve al dashboard de Supabase
   - Verifica que el proyecto no esté pausado
   - Los proyectos gratuitos se pausan después de inactividad

3. **Verificar conexión SSL:**
   - Supabase requiere SSL, el código ya está configurado para esto
   - Si hay problemas, verifica que `sslmode=require` esté en la URL

4. **Probar conexión manualmente:**
   ```bash
   # Usar psql con la connection string de Supabase
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require"
   ```

### Error de pgvector en Supabase

La extensión pgvector ya viene habilitada en Supabase. Si necesitas verificarla:

1. Ve a **Database > Extensions** en el dashboard de Supabase
2. Busca `vector` y verifica que esté habilitada
3. Si no está, haz clic en "Enable"

### Frontend no se conecta al Backend

1. Verificar que el backend esté corriendo en `http://localhost:8000`
2. Verificar `VITE_API_URL` en `.env` del frontend
3. Verificar CORS en configuración del backend

### Puerto ya en uso

```bash
# Cambiar puerto del backend
uvicorn app.main:app --reload --port 8001

# Cambiar puerto del frontend
# Editar vite.config.ts o usar:
npm run dev -- --port 5174
```

## Testing

### Backend
```bash
cd backend
# Instalar pytest si no está instalado
pip install pytest pytest-asyncio

# Ejecutar tests
pytest
```

### Frontend
```bash
cd frontend
# Los tests se pueden agregar con Vitest
npm install -D vitest @testing-library/react
```

## Estructura de Archivos

```
Guiame/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/v1/routers/  # Endpoints de la API
│   │   ├── core/            # Configuración central
│   │   ├── models/         # Modelos de base de datos
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Lógica de negocio
│   │   └── utils/          # Utilidades
│   ├── alembic/            # Migraciones de BD
│   ├── uploads/           # Archivos subidos
│   ├── requirements.txt   # Dependencias Python
│   └── .env.example       # Ejemplo de variables de entorno
│
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la app
│   │   ├── services/      # Servicios API
│   │   ├── store/         # Estado global (Zustand)
│   │   └── utils/         # Utilidades
│   ├── public/           # Archivos estáticos
│   ├── package.json      # Dependencias Node
│   └── .env.example     # Ejemplo de variables de entorno
│
└── README.md             # Este archivo
```

## Endpoints Principales de la API

- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `GET /api/v1/auth/me` - Información del usuario actual
- `GET /api/v1/courses` - Listar cursos
- `POST /api/v1/courses/{id}/enroll` - Inscribirse a curso
- `POST /api/v1/documents/upload` - Subir documento
- `POST /api/v1/rag/query` - Consulta RAG con IA
- `GET /api/v1/chat` - Obtener mensajes
- `POST /api/v1/chat` - Enviar mensaje

Ver documentación completa en: `http://localhost:8000/api/docs`

## Contribuir

1. Crear rama para nueva funcionalidad
2. Hacer cambios y commits descriptivos
3. Verificar que no haya errores de linting
4. Crear Pull Request

## Licencia

Proyecto privado - Todos los derechos reservados

