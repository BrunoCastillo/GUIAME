"""
Punto de entrada para Vercel serverless functions.
Este archivo permite que Vercel ejecute FastAPI como función serverless.
"""
import sys
import os

# Agregar el directorio padre al path para importar app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

# Exportar la app para Vercel
# Vercel buscará este archivo en /api/index.py
__all__ = ["app"]
