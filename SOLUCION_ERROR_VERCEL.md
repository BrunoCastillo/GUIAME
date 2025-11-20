# Solución: Error "API端点不存在" en Vercel

## Problema

El error `{"success":false,"message":"API端点不存在"}` (API endpoint does not exist) indica que Vercel no está encontrando correctamente el handler de FastAPI.

## Soluciones Probadas

### ✅ Solución 1: Verificar que Mangum esté instalado

Asegúrate de que `mangum` esté en `requirements.txt`:
```
mangum==0.17.0
```

### ✅ Solución 2: Verificar estructura del handler

El archivo `api/index.py` debe exportar `handler`:

```python
from app.main import app
from mangum import Mangum

handler = Mangum(app, lifespan="off")
```

### ✅ Solución 3: Verificar vercel.json

El `vercel.json` debe tener:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
```

## Pasos de Verificación

### 1. Verificar Logs en Vercel

1. Ve a tu proyecto en Vercel
2. **Deployments** > Selecciona el último deployment
3. **Functions** > Revisa los logs de errores
4. Busca errores de importación o de módulos

### 2. Verificar que requirements.txt esté en la raíz de backend/

El archivo debe estar en: `backend/requirements.txt`

### 3. Verificar estructura de directorios

```
backend/
├── api/
│   └── index.py          ← Handler de Vercel
├── app/
│   ├── main.py          ← App FastAPI
│   └── ...
├── requirements.txt      ← Dependencias
└── vercel.json          ← Config Vercel
```

### 4. Verificar variables de entorno

En Vercel, asegúrate de tener configuradas:
- `DATABASE_URL` (o variables POSTGRES_*)
- `SECRET_KEY`
- `CORS_ORIGINS`

## Solución Alternativa: Usar ASGI directamente

Si Mangum no funciona, puedes probar con un handler ASGI directo:

```python
# api/index.py
import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.main import app

# Handler para Vercel
async def handler(request):
    from mangum import Mangum
    mangum_handler = Mangum(app, lifespan="off")
    return await mangum_handler(request.scope, request.receive, request.send)
```

## Verificar Deployment

Después de hacer cambios:

1. **Commit y push:**
   ```bash
   git add .
   git commit -m "Fix Vercel handler"
   git push
   ```

2. **En Vercel:**
   - El deployment debería iniciarse automáticamente
   - O haz clic en **Redeploy**

3. **Verificar:**
   - `https://tu-backend.vercel.app/health` → `{"status": "healthy"}`
   - `https://tu-backend.vercel.app/api/docs` → Documentación Swagger

## Si el Error Persiste

1. **Revisa los logs completos** en Vercel
2. **Verifica que todas las dependencias estén en requirements.txt**
3. **Prueba acceder directamente a `/health`** en lugar de `/api/docs`
4. **Verifica que el Root Directory en Vercel sea `backend`**

## Contacto

Si después de estos pasos el error persiste, comparte:
- Los logs completos de Vercel
- La URL exacta que estás intentando acceder
- El mensaje de error completo

