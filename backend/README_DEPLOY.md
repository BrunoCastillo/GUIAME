# Despliegue del Backend en Vercel

## Configuración para Vercel

El backend está configurado para ejecutarse como serverless functions en Vercel.

### Estructura para Vercel

```
backend/
├── api/
│   └── index.py          # Punto de entrada para Vercel
├── app/                  # Código de la aplicación
├── vercel.json          # Configuración de Vercel
└── requirements.txt     # Dependencias
```

### Variables de Entorno Requeridas en Vercel

Configura estas variables en **Settings > Environment Variables**:

**Requeridas:**
- `DATABASE_URL` - Connection string de Supabase
- `SECRET_KEY` - Clave secreta para JWT

**Opcionales pero recomendadas:**
- `SUPABASE_URL` - URL de tu proyecto Supabase
- `SUPABASE_KEY` - Anon key de Supabase
- `SUPABASE_SERVICE_KEY` - Service role key
- `CORS_ORIGINS` - URLs permitidas (separadas por coma)
- `DEEPSEEK_API_KEY` - Para funcionalidad RAG

### Límites de Vercel

- **Timeout**: 30 segundos (configurado en vercel.json)
- **Memoria**: 1024 MB (plan Pro)
- **Tamaño de función**: 50 MB

### Optimizaciones para Vercel

1. **Cold starts**: La primera petición puede tardar más
2. **Dependencias**: Vercel instala automáticamente desde `requirements.txt`
3. **Archivos estáticos**: No uses archivos locales, usa Supabase Storage

### Troubleshooting

**Error: "Module not found"**
- Verifica que `requirements.txt` esté en la raíz de `backend/`
- Verifica que todas las dependencias estén listadas

**Error: "Timeout"**
- Aumenta `maxDuration` en `vercel.json` (máximo 60s en plan Pro)
- Optimiza consultas a la base de datos

**Error de conexión a Supabase**
- Verifica que `DATABASE_URL` esté correctamente configurada
- Verifica que Supabase permita conexiones externas

