# Solución: Error "Out of Memory" en Vercel

## Problema

Vercel está reportando "Out of Memory" (OOM) durante el build. Esto ocurre porque algunas dependencias son muy pesadas:

- `sentence-transformers` (~500MB)
- `chromadb` (~200MB)
- `langchain` (~100MB)
- `pytesseract` (requiere binarios adicionales)

## Solución: Usar requirements-vercel.txt

He creado `requirements-vercel.txt` con solo las dependencias esenciales para Vercel.

### Opción 1: Cambiar Install Command en Vercel (Recomendado)

1. Ve a tu proyecto en Vercel
2. **Settings > General > Build & Development Settings**
3. Cambia **Install Command** de:
   ```
   pip install -r requirements.txt
   ```
   a:
   ```
   pip install -r requirements-vercel.txt
   ```
4. Guarda y haz **Redeploy**

### Opción 2: Renombrar archivo (Alternativa)

Si prefieres, puedes renombrar el archivo:

```bash
# En local
cd backend
mv requirements.txt requirements-full.txt
mv requirements-vercel.txt requirements.txt
git add .
git commit -m "Optimizar dependencias para Vercel"
git push
```

## Dependencias Removidas (Pesadas)

Estas dependencias NO están en `requirements-vercel.txt`:

- ❌ `sentence-transformers` - Muy pesado (~500MB)
- ❌ `chromadb` - Pesado (~200MB)
- ❌ `langchain` - Pesado (~100MB)
- ❌ `pytesseract` - Requiere Tesseract instalado
- ❌ `openai` - Solo si no lo usas directamente

## Alternativas para Funcionalidades RAG

Si necesitas RAG (Retrieval Augmented Generation):

### Opción A: Usar APIs Externas
- Usa APIs de embeddings (OpenAI, Cohere, etc.)
- Usa pgvector en Supabase para almacenar embeddings
- No necesitas librerías locales pesadas

### Opción B: Servicio Separado
- Crea un servicio separado para procesamiento pesado
- Usa Railway, Render, o un servidor dedicado
- El backend en Vercel solo hace llamadas HTTP

### Opción C: Edge Functions
- Usa Vercel Edge Functions para procesamiento ligero
- Mantén el backend principal ligero

## Verificar que Funciona

Después de cambiar a `requirements-vercel.txt`:

1. El build debería completarse sin OOM
2. Verifica: `https://tu-backend.vercel.app/health`
3. Si necesitas las funcionalidades pesadas, implementa las alternativas

## Si Necesitas las Dependencias Pesadas

Si realmente necesitas las librerías pesadas:

1. **Upgrade a Vercel Pro** (más memoria)
2. **Usa un servicio separado** para procesamiento pesado
3. **Optimiza el código** para cargar solo lo necesario

## Próximos Pasos

1. ✅ Cambia Install Command en Vercel a `requirements-vercel.txt`
2. ✅ Haz Redeploy
3. ✅ Verifica que el build termine sin errores
4. ✅ Prueba los endpoints

