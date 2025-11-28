# 🚀 Despliegue Rápido en Vercel

## Pasos Rápidos

### 1. Backend (5 minutos)

1. **Conectar a Vercel**:
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Importa tu repositorio
   - **Root Directory**: `backend`
   - **Framework**: Other

2. **Variables de Entorno** (Settings > Environment Variables):
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
   SECRET_KEY=tu-clave-secreta-minimo-32-caracteres
   CORS_ORIGINS=https://tu-frontend.vercel.app
   ENVIRONMENT=production
   DEBUG=False
   ```

3. **Deploy** y copia la URL del backend

### 2. Frontend (3 minutos)

1. **Conectar a Vercel**:
   - Click en "Add New Project"
   - Mismo repositorio
   - **Root Directory**: `frontend`
   - **Framework**: Vite (auto-detectado)

2. **Variables de Entorno**:
   ```
   VITE_API_URL=https://tu-backend.vercel.app
   ```
   ⚠️ Reemplaza con la URL real del backend

3. **Actualizar vercel.json**:
   - Edita `frontend/vercel.json`
   - Cambia `https://tu-backend.vercel.app` por tu URL real

4. **Deploy**

### 3. Actualizar CORS (1 minuto)

1. Ve al proyecto del backend en Vercel
2. **Settings > Environment Variables**
3. Actualiza `CORS_ORIGINS` con la URL del frontend
4. **Redeploy** el backend

## ✅ Listo!

Tu aplicación debería estar funcionando en:
- Frontend: `https://tu-frontend.vercel.app`
- Backend: `https://tu-backend.vercel.app`

## 🔧 Troubleshooting Rápido

| Error | Solución |
|-------|----------|
| CORS error | Actualiza `CORS_ORIGINS` en backend |
| 404 en API | Verifica `VITE_API_URL` en frontend |
| Database error | Verifica `DATABASE_URL` en backend |
| Build failed | Revisa logs en Vercel Dashboard |

## 📚 Documentación Completa

Ver `DEPLOY_VERCEL.md` para instrucciones detalladas.

