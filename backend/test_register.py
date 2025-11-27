"""
Script para probar el endpoint de registro directamente.
"""
import requests
import json

# URL del endpoint
url = "http://localhost:8000/api/v1/auth/register"

# Datos de prueba
data = {
    "email": "admin@gmail.com",
    "password": "test123",
    "role": "student"
}

print("=" * 50)
print("Probando endpoint de registro...")
print(f"URL: {url}")
print(f"Datos: {json.dumps(data, indent=2)}")
print("=" * 50)

try:
    response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"\nResponse Text: {response.text}")
    
    if response.status_code == 200 or response.status_code == 201:
        print("\n[OK] Registro exitoso!")
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"\n[ERROR] Status {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
        try:
            error_json = response.json()
            print(f"Error JSON: {json.dumps(error_json, indent=2)}")
        except:
            print(f"Error Text: {response.text}")
            
except requests.exceptions.ConnectionError:
    print("\n[ERROR] No se pudo conectar al servidor.")
    print("   Verifica que el servidor este corriendo en http://localhost:8000")
except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {str(e)}")

