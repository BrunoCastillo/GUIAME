"""
Punto de entrada para Vercel serverless functions.
Vercel ejecutará este archivo como función serverless.
"""
import sys
import os

# Agregar el directorio backend al path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Importar la app de FastAPI
from app.main import app
from mangum import Mangum

# Crear handler para Vercel
# Vercel busca una variable llamada 'handler' en este módulo
handler = Mangum(app, lifespan="off")
