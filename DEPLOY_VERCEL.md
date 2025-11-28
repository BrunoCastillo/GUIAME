# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tanto el frontend como el backend de la plataforma de capacitación en Vercel.

## 📋 Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [Supabase](https://supabase.com) para la base de datos
3. Repositorio en GitHub con el código

## 🚀 Paso 1: Desplegar el Backend

### 1.1. Conectar el Backend a Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Configura el proyecto:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: (dejar vacío)
   - **Output Directory**: (dejar vacío)
   - **Install Command**: `pip install -r requirements.txt`

### 1.2. Variables de Entorno del Backend

En **Settings > Environment Variables**, agrega:

```env
# Base de datos (OBLIGATORIO)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require

# Seguridad (OBLIGATORIO)
SECRET_KEY=tu-clave-secreta-super-segura-minimo-32-caracteres

# Supabase (Recomendado)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-role-key

# CORS - URL del frontend (IMPORTANTE)
CORS_ORIGINS=https://tu-frontend.vercel.app,https://tu-dominio.com

# Entorno
ENVIRONMENT=production
DEBUG=False

# AI Services (Opcional)
DEEPSEEK_API_KEY=tu-api-key
```

### 1.3. Configuración del Backend

El archivo `backend/vercel.json` ya está configurado. Asegúrate de que:
- El archivo `backend/api/index.py` existe
- El archivo `backend/requirements.txt` contiene todas las dependencias

### 1.4. Desplegar Backend

1. Click en **"Deploy"**
2. Espera a que termine el despliegue
3. Copia la URL del backend (ej: `https://tu-backend.vercel.app`)

## 🎨 Paso 2: Desplegar el Frontend

### 2.1. Conectar el Frontend a Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New Project"**
3. Importa el mismo repositorio de GitHub
4. Configura el proyecto:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.2. Variables de Entorno del Frontend

En **Settings > Environment Variables**, agrega:

```env
# URL del backend (OBLIGATORIO)
VITE_API_URL=https://tu-backend.vercel.app
```

**IMPORTANTE**: Reemplaza `https://tu-backend.vercel.app` con la URL real de tu backend desplegado.

### 2.3. Actualizar vercel.json del Frontend

Edita `frontend/vercel.json` y actualiza la URL del backend:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://tu-backend.vercel.app/api/$1"
    }
  ]
}
```

### 2.4. Desplegar Frontend

1. Click en **"Deploy"**
2. Espera a que termine el despliegue
3. Copia la URL del frontend (ej: `https://tu-frontend.vercel.app`)

## 🔄 Paso 3: Actualizar CORS del Backend

Después de desplegar el frontend, actualiza las variables de entorno del backend:

1. Ve al proyecto del backend en Vercel
2. **Settings > Environment Variables**
3. Actualiza `CORS_ORIGINS` con la URL del frontend:
   ```
   https://tu-frontend.vercel.app
   ```
4. **Redeploy** el backend para aplicar los cambios

## ✅ Paso 4: Verificar el Despliegue

1. Abre la URL del frontend en tu navegador
2. Intenta hacer login
3. Verifica que las peticiones al backend funcionen correctamente

## 🔧 Troubleshooting

### Error: "Module not found" en Backend

- Verifica que `requirements.txt` esté en la raíz de `backend/`
- Asegúrate de que todas las dependencias estén listadas

### Error: "CORS policy" en Frontend

- Verifica que `CORS_ORIGINS` en el backend incluya la URL exacta del frontend
- Asegúrate de que no haya espacios o caracteres extra
- Redeploy el backend después de cambiar `CORS_ORIGINS`

### Error: "Database connection failed"

- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que Supabase permita conexiones externas
- Verifica que el formato de la URL sea correcto

### Error: "Build failed" en Frontend

- Verifica que `package.json` esté en la raíz de `frontend/`
- Revisa los logs de build en Vercel
- Asegúrate de que todas las dependencias estén en `package.json`

### Error: "Timeout" en Backend

- Las funciones serverless tienen un timeout de 10 segundos (plan Hobby) o 60 segundos (plan Pro)
- Optimiza las consultas a la base de datos
- Considera usar conexiones pooling de Supabase

## 📝 Notas Importantes

1. **Base de Datos**: Asegúrate de ejecutar las migraciones en Supabase antes de desplegar
2. **Variables de Entorno**: Nunca commitees archivos `.env` al repositorio
3. **CORS**: En producción, especifica solo los orígenes permitidos
4. **Logs**: Revisa los logs en Vercel Dashboard para diagnosticar problemas
5. **Cold Starts**: La primera petición puede tardar más (hasta 10 segundos)

## 🔐 Seguridad

- Usa claves secretas fuertes para `SECRET_KEY`
- No expongas `SUPABASE_SERVICE_KEY` en el frontend
- Configura CORS correctamente para producción
- Usa HTTPS siempre (Vercel lo proporciona automáticamente)

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Supabase](https://supabase.com/docs)

