# Guía de Despliegue

Esta guía explica cómo desplegar la plataforma de capacitación en Vercel y configurar el repositorio en GitHub.

## Prerrequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Git instalado localmente

## Paso 0: Configurar Git (Primera vez)

Si es la primera vez que usas Git en esta máquina, configura tu identidad:

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu-email@ejemplo.com"
```

**Nota:** Usa el mismo email que tienes en GitHub para que los commits se vinculen a tu cuenta.

Verifica la configuración:
```bash
git config --global user.name
git config --global user.email
```

## Paso 1: Crear Repositorio en GitHub

### 1.1 Crear repositorio nuevo

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en "New repository"
3. Completa:
   - **Repository name**: `plataforma-capacitacion` (o el nombre que prefieras)
   - **Description**: Plataforma de Capacitación Interactiva Multiempresa
   - **Visibility**: Private o Public (según prefieras)
   - **NO** marques "Initialize with README" (ya tenemos uno)
4. Haz clic en "Create repository"

### 1.2 Subir código al repositorio

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "Initial commit: Plataforma de Capacitación"

# Agregar el repositorio remoto (reemplaza USERNAME y REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Subir código
git branch -M main
git push -u origin main
```

## Paso 2: Configurar Supabase

### 2.1 Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Crea un nuevo proyecto
3. Guarda todas las credenciales:
   - Database URL
   - Supabase URL
   - Anon Key
   - Service Role Key

### 2.2 Ejecutar migraciones

```bash
cd backend
# Configurar .env con credenciales de Supabase
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Paso 3: Desplegar Backend en Vercel

### 3.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Configurar proyecto backend

```bash
cd backend
vercel login
vercel link
```

Sigue las instrucciones:
- **Set up and deploy?** → Y
- **Which scope?** → Tu cuenta
- **Link to existing project?** → N
- **Project name?** → `plataforma-capacitacion-backend`
- **Directory?** → `./`

### 3.3 Configurar variables de entorno en Vercel

1. Ve al dashboard de Vercel
2. Selecciona tu proyecto backend
3. Ve a **Settings > Environment Variables**
4. Agrega las siguientes variables:

```
DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres
SECRET_KEY=tu-clave-secreta-generada
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key
CORS_ORIGINS=https://tu-frontend.vercel.app
```

### 3.4 Desplegar backend

```bash
cd backend
vercel --prod
```

Anota la URL del backend (ej: `https://plataforma-capacitacion-backend.vercel.app`)

## Paso 4: Desplegar Frontend en Vercel

### 4.1 Configurar proyecto frontend

```bash
cd frontend
vercel login
vercel link
```

Sigue las instrucciones:
- **Set up and deploy?** → Y
- **Which scope?** → Tu cuenta
- **Link to existing project?** → N
- **Project name?** → `plataforma-capacitacion-frontend`
- **Directory?** → `./`

### 4.2 Configurar variables de entorno

En el dashboard de Vercel, agrega:

```
VITE_API_URL=https://tu-backend.vercel.app
```

### 4.3 Desplegar frontend

```bash
cd frontend
vercel --prod
```

## Paso 5: Configurar GitHub Secrets (Opcional - para CI/CD)

Si quieres usar GitHub Actions para despliegue automático:

1. Ve a tu repositorio en GitHub
2. **Settings > Secrets and variables > Actions**
3. Agrega los siguientes secrets:

```
VERCEL_TOKEN=tu-vercel-token
VERCEL_ORG_ID=tu-org-id
VERCEL_PROJECT_ID_BACKEND=tu-project-id-backend
VERCEL_PROJECT_ID_FRONTEND=tu-project-id-frontend
```

**Cómo obtener estos valores:**
- `VERCEL_TOKEN`: [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`: Ejecuta `vercel inspect` en cada proyecto

## Paso 6: Configurar Dominios Personalizados (Opcional)

### 6.1 En Vercel

1. Ve a tu proyecto en Vercel
2. **Settings > Domains**
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

## Estructura de URLs después del despliegue

- **Frontend**: `https://plataforma-capacitacion-frontend.vercel.app`
- **Backend API**: `https://plataforma-capacitacion-backend.vercel.app`
- **API Docs**: `https://plataforma-capacitacion-backend.vercel.app/api/docs`

## Actualizar Frontend para usar Backend en Producción

Edita `frontend/vercel.json` y actualiza la URL del backend:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://tu-backend.vercel.app/api/$1"
    }
  ]
}
```

## Verificar Despliegue

1. **Backend:**
   - Visita: `https://tu-backend.vercel.app/health`
   - Deberías ver: `{"status": "healthy"}`
   - Visita: `https://tu-backend.vercel.app/api/docs`
   - Deberías ver la documentación Swagger

2. **Frontend:**
   - Visita la URL de tu frontend
   - Deberías ver la página de login
   - Intenta registrarte o iniciar sesión

## Troubleshooting

### Error: "Module not found" en Vercel

- Verifica que `requirements.txt` esté en la raíz del proyecto backend
- Verifica que `package.json` esté en la raíz del proyecto frontend

### Error de conexión a base de datos

- Verifica que `DATABASE_URL` esté correctamente configurada en Vercel
- Verifica que Supabase permita conexiones desde Vercel (debería por defecto)
- Revisa los logs en Vercel: **Deployments > [tu deployment] > Functions**

### CORS Error

- Verifica que `CORS_ORIGINS` en el backend incluya la URL del frontend
- Formato: `https://tu-frontend.vercel.app`

### Variables de entorno no funcionan

- Las variables deben estar en **Production** environment
- Reinicia el deployment después de agregar variables
- Verifica que los nombres de las variables coincidan exactamente

## Comandos Útiles

```bash
# Ver logs del backend
vercel logs --follow

# Ver logs del frontend
cd frontend && vercel logs --follow

# Redesplegar backend
cd backend && vercel --prod

# Redesplegar frontend
cd frontend && vercel --prod

# Ver información del proyecto
vercel inspect
```

## Próximos Pasos

1. Configurar dominio personalizado
2. Configurar SSL (automático en Vercel)
3. Configurar monitoreo y alertas
4. Configurar backups de base de datos en Supabase
5. Configurar CI/CD completo con GitHub Actions

