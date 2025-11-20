# Configurar Despliegue en Vercel

Guía paso a paso para desplegar backend y frontend en Vercel.

## Prerrequisitos

- ✅ Código subido a GitHub: `https://github.com/BrunoCastillo/GUIAME`
- ⚠️ Cuenta en Vercel (gratuita)
- ⚠️ Cuenta en Supabase con proyecto creado

## Paso 1: Crear Cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel a acceder a tus repositorios
5. Completa el registro

## Paso 2: Desplegar Backend

### 2.1 Importar Proyecto Backend

1. En el dashboard de Vercel, haz clic en **"Add New..."** > **"Project"**
2. Selecciona el repositorio: **BrunoCastillo/GUIAME**
3. En **"Configure Project"**:
   - **Framework Preset**: Otro
   - **Root Directory**: `backend`
   - **Build Command**: (dejar vacío)
   - **Output Directory**: (dejar vacío)
   - **Install Command**: `pip install -r requirements.txt`
4. Haz clic en **"Deploy"**

### 2.2 Configurar Variables de Entorno del Backend

Después del primer despliegue:

1. Ve a **Settings > Environment Variables**
2. Agrega las siguientes variables:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SECRET_KEY=tu-clave-secreta-generada-aqui
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_KEY=tu-supabase-service-key
CORS_ORIGINS=https://tu-frontend.vercel.app
```

**Cómo obtener estas variables:**
- `DATABASE_URL`: Supabase > Settings > Database > Connection string (URI)
- `SECRET_KEY`: Genera con `openssl rand -hex 32` o usa cualquier string seguro
- `SUPABASE_URL`: Supabase > Settings > API > Project URL
- `SUPABASE_KEY`: Supabase > Settings > API > anon public key
- `SUPABASE_SERVICE_KEY`: Supabase > Settings > API > service_role key
- `CORS_ORIGINS`: La URL de tu frontend (la obtendrás después)

3. Selecciona **"Apply to Production"** para cada variable
4. Haz clic en **"Save"**

### 2.3 Redesplegar Backend

1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **"Redeploy"**
4. Espera a que termine

**Anota la URL del backend:** `https://tu-backend.vercel.app`

## Paso 3: Desplegar Frontend

### 3.1 Importar Proyecto Frontend

1. En el dashboard de Vercel, haz clic en **"Add New..."** > **"Project"**
2. Selecciona el mismo repositorio: **BrunoCastillo/GUIAME**
3. En **"Configure Project"**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `dist` (automático)
   - **Install Command**: `npm install` (automático)
4. Haz clic en **"Deploy"**

### 3.2 Configurar Variables de Entorno del Frontend

1. Ve a **Settings > Environment Variables**
2. Agrega:

```
VITE_API_URL=https://tu-backend.vercel.app
```

(Usa la URL del backend que anotaste antes)

3. Selecciona **"Apply to Production"**
4. Haz clic en **"Save"**

### 3.3 Redesplegar Frontend

1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **"Redeploy"**

**Anota la URL del frontend:** `https://tu-frontend.vercel.app`

## Paso 4: Actualizar CORS en Backend

Ahora que tienes la URL del frontend:

1. Ve al proyecto **backend** en Vercel
2. **Settings > Environment Variables**
3. Edita `CORS_ORIGINS` y agrega la URL del frontend:
   ```
   CORS_ORIGINS=https://tu-frontend.vercel.app
   ```
4. **Redeploy** el backend

## Paso 5: Verificar Despliegue

### Backend

1. Visita: `https://tu-backend.vercel.app/health`
   - Deberías ver: `{"status": "healthy"}`

2. Visita: `https://tu-backend.vercel.app/api/docs`
   - Deberías ver la documentación Swagger

### Frontend

1. Visita: `https://tu-frontend.vercel.app`
   - Deberías ver la página de login

## Paso 6: Configurar Dominio Personalizado (Opcional)

### Para Backend:

1. Ve a **Settings > Domains**
2. Agrega tu dominio (ej: `api.tudominio.com`)
3. Sigue las instrucciones para configurar DNS

### Para Frontend:

1. Ve a **Settings > Domains**
2. Agrega tu dominio (ej: `app.tudominio.com`)
3. Sigue las instrucciones para configurar DNS

## Troubleshooting

### Error: "Module not found"

- Verifica que `requirements.txt` esté en `backend/`
- Verifica que `package.json` esté en `frontend/`

### Error de conexión a base de datos

- Verifica que `DATABASE_URL` esté correcta
- Verifica que Supabase permita conexiones externas
- Revisa los logs en Vercel: **Deployments > [deployment] > Functions**

### Error de CORS

- Verifica que `CORS_ORIGINS` incluya la URL exacta del frontend
- Asegúrate de hacer redeploy después de cambiar variables

### Variables de entorno no funcionan

- Verifica que estén en **Production** environment
- Haz redeploy después de agregar variables
- Verifica que los nombres coincidan exactamente

## Comandos Útiles

### Ver logs en tiempo real

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Ver logs del backend
cd backend
vercel logs --follow

# Ver logs del frontend
cd frontend
vercel logs --follow
```

## URLs Finales

Después de configurar todo:

- **Frontend**: `https://tu-frontend.vercel.app`
- **Backend API**: `https://tu-backend.vercel.app`
- **API Docs**: `https://tu-backend.vercel.app/api/docs`

## Próximos Pasos

1. ✅ Configurar Supabase (si no lo has hecho)
2. ✅ Ejecutar migraciones en Supabase
3. ✅ Probar la aplicación en producción
4. ✅ Configurar monitoreo y alertas
5. ✅ Configurar backups de base de datos

