# 🚀 Pasos Rápidos para Desplegar en Vercel

## ✅ Estado Actual
- ✅ Código en GitHub: `https://github.com/BrunoCastillo/GUIAME`
- ⚠️ Pendiente: Configurar Vercel

## 📋 Checklist de Configuración

### Paso 1: Crear Cuenta en Vercel (2 minutos)

1. Ve a [vercel.com/signup](https://vercel.com/signup)
2. Haz clic en **"Continue with GitHub"**
3. Autoriza a Vercel
4. ¡Listo!

### Paso 2: Desplegar BACKEND (5 minutos)

#### 2.1 Importar Proyecto

1. En Vercel dashboard, clic en **"Add New..."** > **"Project"**
2. Busca y selecciona: **BrunoCastillo/GUIAME**
3. En la configuración:
   ```
   Framework Preset: Other
   Root Directory: backend
   Build Command: (vacío)
   Output Directory: (vacío)
   Install Command: pip install -r requirements.txt
   ```
4. Clic en **"Deploy"**

#### 2.2 Configurar Variables de Entorno

**IMPORTANTE:** Después del primer deploy, ve a **Settings > Environment Variables** y agrega:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SECRET_KEY=genera-una-clave-secreta-aqui
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key
CORS_ORIGINS=https://tu-frontend.vercel.app
```

**⚠️ Selecciona "Apply to Production" para cada variable**

#### 2.3 Redesplegar

1. Ve a **Deployments**
2. Clic en **3 puntos** > **"Redeploy"**

**📝 Anota la URL del backend:** `https://[nombre-proyecto].vercel.app`

### Paso 3: Desplegar FRONTEND (5 minutos)

#### 3.1 Importar Proyecto

1. En Vercel dashboard, clic en **"Add New..."** > **"Project"**
2. Selecciona el mismo repo: **BrunoCastillo/GUIAME**
3. En la configuración:
   ```
   Framework Preset: Vite (se detecta automáticamente)
   Root Directory: frontend
   ```
4. Clic en **"Deploy"**

#### 3.2 Configurar Variables de Entorno

1. Ve a **Settings > Environment Variables**
2. Agrega:
   ```
   VITE_API_URL=https://tu-backend.vercel.app
   ```
   (Usa la URL del backend que anotaste)

3. **⚠️ Selecciona "Apply to Production"**
4. Clic en **"Save"**

#### 3.3 Redesplegar

1. Ve a **Deployments**
2. Clic en **3 puntos** > **"Redeploy"**

**📝 Anota la URL del frontend:** `https://[nombre-proyecto].vercel.app`

### Paso 4: Actualizar CORS (2 minutos)

1. Ve al proyecto **BACKEND** en Vercel
2. **Settings > Environment Variables**
3. Edita `CORS_ORIGINS` y agrega la URL del frontend:
   ```
   CORS_ORIGINS=https://tu-frontend.vercel.app
   ```
4. **Redeploy** el backend

## ✅ Verificación

### Backend
- ✅ `https://tu-backend.vercel.app/health` → `{"status": "healthy"}`
- ✅ `https://tu-backend.vercel.app/api/docs` → Documentación Swagger

### Frontend
- ✅ `https://tu-frontend.vercel.app` → Página de login

## 🔧 Obtener Credenciales de Supabase

### DATABASE_URL
1. Supabase Dashboard > **Settings > Database**
2. **Connection string** > Selecciona **"URI"**
3. Copia la URL completa

### SUPABASE_URL
1. Supabase Dashboard > **Settings > API**
2. Copia **"Project URL"**

### SUPABASE_KEY
1. Supabase Dashboard > **Settings > API**
2. Copia **"anon public"** key

### SUPABASE_SERVICE_KEY
1. Supabase Dashboard > **Settings > API**
2. Copia **"service_role"** key (⚠️ Mantén esto secreto)

### SECRET_KEY
Genera una clave secreta segura:
```bash
# En PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# O usa cualquier string largo y aleatorio
```

## 🆘 Problemas Comunes

### "Module not found"
- ✅ Verifica que `requirements.txt` esté en `backend/`
- ✅ Verifica que `package.json` esté en `frontend/`

### Error de conexión a BD
- ✅ Verifica `DATABASE_URL` en variables de entorno
- ✅ Verifica que Supabase permita conexiones externas
- ✅ Revisa logs: **Deployments > [deployment] > Functions**

### Error de CORS
- ✅ Verifica que `CORS_ORIGINS` tenga la URL exacta del frontend
- ✅ Haz redeploy después de cambiar variables

## 📚 Documentación Completa

Para más detalles, consulta:
- `CONFIGURAR_VERCEL.md` - Guía detallada
- `DEPLOYMENT.md` - Guía completa de despliegue

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará en producción:
- Frontend: `https://tu-frontend.vercel.app`
- Backend: `https://tu-backend.vercel.app`

