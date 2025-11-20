# Guía de Contribución

## Configuración del Entorno de Desarrollo

1. Fork el repositorio
2. Clona tu fork:
   ```bash
   git clone https://github.com/TU_USUARIO/plataforma-capacitacion.git
   cd plataforma-capacitacion
   ```

3. Configura el backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. Configura el frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Editar .env con la URL del backend
   ```

## Flujo de Trabajo

1. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```

2. Realiza tus cambios

3. Commit tus cambios:
   ```bash
   git add .
   git commit -m "feat: descripción de los cambios"
   ```

4. Push a tu fork:
   ```bash
   git push origin feature/mi-nueva-funcionalidad
   ```

5. Abre un Pull Request en GitHub

## Convenciones de Código

### Backend (Python)
- Usar type hints
- Seguir PEP 8
- Documentar funciones y clases
- Usar nombres descriptivos

### Frontend (TypeScript/React)
- Usar TypeScript estricto
- Seguir convenciones de React
- Componentes funcionales
- Hooks personalizados cuando sea necesario

## Testing

Antes de hacer commit, asegúrate de:
- Ejecutar linters
- Verificar que no haya errores de tipo
- Probar localmente

