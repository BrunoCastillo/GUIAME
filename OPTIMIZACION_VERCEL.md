# Optimización Extrema para Vercel

## Cambios Realizados

### 1. Dependencias Mínimas

He reducido `requirements.txt` a solo lo esencial:
- ✅ FastAPI + Mangum (core)
- ✅ SQLAlchemy + psycopg2 (database)
- ✅ Pydantic (validación)
- ✅ Seguridad básica (JWT, bcrypt)
- ✅ Supabase client

### 2. Dependencias Removidas

- ❌ `uvicorn` - No necesario en serverless
- ❌ `alembic` - Ejecutar migraciones manualmente
- ❌ `pgvector` - Instalar extensión en Supabase directamente
- ❌ `aiofiles` - No crítico
- ❌ `slowapi` - Rate limiting opcional
- ❌ Todas las librerías de ML/IA pesadas
- ❌ Procesamiento de documentos pesado

### 3. Optimizaciones de Código

- Pool de conexiones reducido (2 en lugar de 10)
- No crear tablas automáticamente en startup
- Configuración optimizada para serverless

## Si Aún Hay Error de Memoria

### Opción 1: Upgrade a Vercel Pro

Vercel Pro tiene más memoria disponible:
- Plan Hobby: 1024 MB
- Plan Pro: 2048 MB

### Opción 2: Usar Railway o Render

Alternativas con más recursos:
- **Railway**: 512 MB RAM (gratis), fácil escalado
- **Render**: 512 MB RAM (gratis), buen para Python

### Opción 3: Arquitectura Híbrida

- Backend ligero en Vercel (API principal)
- Servicio separado para procesamiento pesado (Railway/Render)
- Comunicación vía HTTP entre servicios

## Verificar Build

Después de estos cambios, el build debería:
- ✅ Completarse en menos tiempo
- ✅ Usar menos memoria
- ✅ Instalar solo dependencias esenciales

## Si el Error Persiste

1. **Revisa los logs completos** en Vercel
2. **Verifica el tamaño total** de las dependencias
3. **Considera usar un servicio diferente** para el backend
4. **O divide la aplicación** en microservicios

## Migraciones de Base de Datos

Como removimos Alembic, ejecuta migraciones manualmente:

```bash
# En local o en un servicio separado
cd backend
pip install alembic  # Solo para migraciones
alembic upgrade head
```

O usa el SQL Editor de Supabase para ejecutar las migraciones directamente.

