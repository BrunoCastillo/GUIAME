# Despliegue del Frontend en Vercel

## Configuración para Vercel

El frontend está configurado para desplegarse automáticamente en Vercel.

### Variables de Entorno

Configura en **Settings > Environment Variables**:

```
VITE_API_URL=https://tu-backend.vercel.app
```

### Build Configuration

Vercel detecta automáticamente:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Configuración Personalizada

El archivo `vercel.json` contiene:
- Rewrites para proxy de API
- Variables de entorno
- Configuración de framework

### Dominio Personalizado

1. Ve a **Settings > Domains**
2. Agrega tu dominio
3. Configura DNS según las instrucciones de Vercel

### Preview Deployments

Cada push a una rama crea un preview deployment automáticamente.

### Troubleshooting

**Error: "Build failed"**
- Verifica que `package.json` esté en la raíz
- Revisa los logs de build en Vercel
- Verifica que todas las dependencias estén en `package.json`

**Error: "API not found"**
- Verifica `VITE_API_URL` en variables de entorno
- Verifica que el backend esté desplegado
- Revisa `vercel.json` para rewrites

**Error de CORS**
- Verifica que el backend tenga configurado `CORS_ORIGINS` con la URL del frontend

