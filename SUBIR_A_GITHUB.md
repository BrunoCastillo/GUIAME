# Cómo Subir el Código a GitHub

## Estado Actual

Según la verificación:
- ✅ Git está configurado correctamente
- ✅ Tienes un commit local: "Initial commit: Plataforma de Capacitación"
- ⚠️ El repositorio remoto no existe en GitHub aún (o no tienes acceso)

## Pasos para Subir a GitHub

### Paso 1: Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (arriba a la derecha) > **"New repository"**
3. Completa el formulario:
   - **Repository name**: `GUIAME` (o el nombre que prefieras)
   - **Description**: Plataforma de Capacitación Interactiva Multiempresa
   - **Visibility**: 
     - ✅ **Public** (cualquiera puede ver)
     - ✅ **Private** (solo tú y colaboradores)
   - ⚠️ **NO** marques "Add a README file" (ya tenemos uno)
   - ⚠️ **NO** marques "Add .gitignore" (ya tenemos uno)
   - ⚠️ **NO** marques "Choose a license"
4. Haz clic en **"Create repository"**

### Paso 2: Subir el Código

Después de crear el repositorio, GitHub te mostrará instrucciones. Ejecuta estos comandos:

```bash
# 1. Agregar el remoto (si no está ya configurado)
git remote add origin https://github.com/BrunoCastillo/GUIAME.git

# O si ya está configurado pero necesitas actualizarlo:
git remote set-url origin https://github.com/BrunoCastillo/GUIAME.git

# 2. Agregar todos los archivos (incluyendo cambios recientes)
git add .

# 3. Hacer commit de los cambios
git commit -m "Initial commit: Plataforma de Capacitación"

# 4. Subir a GitHub
git branch -M main
git push -u origin main
```

### Paso 3: Verificar que se Subió

1. Ve a: `https://github.com/BrunoCastillo/GUIAME`
2. Deberías ver:
   - ✅ Todos los archivos del proyecto
   - ✅ El commit "Initial commit: Plataforma de Capacitación"
   - ✅ La estructura de carpetas (backend/, frontend/, etc.)

## Si el Repositorio Ya Existe

Si el repositorio ya existe pero está vacío:

```bash
# Verificar remoto
git remote -v

# Si necesitas cambiar la URL:
git remote set-url origin https://github.com/BrunoCastillo/GUIAME.git

# Subir código
git push -u origin main
```

## Si Tienes Problemas de Autenticación

### Opción 1: Usar Personal Access Token

1. Ve a [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Genera un nuevo token con permisos `repo`
3. Cuando hagas `git push`, usa el token como contraseña

### Opción 2: Usar GitHub CLI

```bash
# Instalar GitHub CLI
# Windows: winget install GitHub.cli
# O descarga desde: https://cli.github.com

# Autenticarse
gh auth login

# Luego hacer push normalmente
git push -u origin main
```

## Comandos de Verificación

Después de subir, verifica:

```bash
# Ver commits en remoto
git fetch origin
git log origin/main --oneline

# Ver estado
git status

# Ver diferencias (no debería haber ninguna)
git log origin/main..HEAD
```

## Estructura que Deberías Ver en GitHub

```
GUIAME/
├── .github/
│   └── workflows/
├── backend/
│   ├── api/
│   ├── app/
│   ├── alembic/
│   └── ...
├── frontend/
│   ├── src/
│   └── ...
├── .gitignore
├── README.md
├── DEPLOYMENT.md
└── ...
```

## Próximos Pasos Después de Subir

1. ✅ Verificar que todos los archivos estén en GitHub
2. ✅ Configurar GitHub Secrets (para CI/CD)
3. ✅ Conectar con Vercel para despliegue automático
4. ✅ Configurar branch protection (opcional)

