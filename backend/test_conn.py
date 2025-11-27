import psycopg2
from psycopg2 import OperationalError

try:
    conn = psycopg2.connect(
        host="aws-0-sa-east-1.pooler.supabase.com",
        port=6543,
        dbname="postgres",
        user="postgres",
        password="diM7iV1qCui6nxep",   # <- pega aquí la contraseña exacta de tu .env
        sslmode="require",
        options="-c project=gatwolhwmiaqqnjuszuh"
    )
    print("✅ psycopg2: Conectado OK")
    conn.close()
except OperationalError as e:
    print("❌ psycopg2 Error de conexión:", e)
