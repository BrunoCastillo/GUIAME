# Solucionar Error: Email Privado en GitHub

## Problema

GitHub está bloqueando el push porque tu email está configurado como privado.

Error:
```
remote: error: GH007: Your push would publish a private email address.
```

## Solución: Usar Email Privado de GitHub

GitHub proporciona un email privado que puedes usar sin exponer tu email real.

### Paso 1: Obtener tu Email Privado de GitHub

1. Ve a [GitHub Settings > Emails](https://github.com/settings/emails)
2. Busca la sección "Keep my email addresses private"
3. Copia el email que aparece, formato: `TU_USERNAME@users.noreply.github.com`
   - Ejemplo: `BrunoCastillo@users.noreply.github.com`

### Paso 2: Configurar Git con el Email Privado

```bash
git config --global user.email "TU_USERNAME@users.noreply.github.com"
```

**Ejemplo:**
```bash
git config --global user.email "BrunoCastillo@users.noreply.github.com"
```

### Paso 3: Actualizar el Último Commit

Como ya hiciste el commit con el email anterior, necesitas actualizarlo:

```bash
# Actualizar el autor del último commit
git commit --amend --reset-author --no-edit

# O si quieres cambiar solo el email:
git commit --amend --author="BrunoCastillo <BrunoCastillo@users.noreply.github.com>" --no-edit
```

### Paso 4: Subir a GitHub

```bash
git push -u origin main
```

## Alternativa: Hacer el Email Público

Si prefieres usar tu email real:

1. Ve a [GitHub Settings > Emails](https://github.com/settings/emails)
2. Desmarca "Keep my email addresses private"
3. Haz push nuevamente:

```bash
git push -u origin main
```

## Verificar Configuración

```bash
# Ver email configurado
git config --global user.email

# Ver información del último commit
git log -1 --format='%an <%ae>'
```

## Nota

- El email privado de GitHub funciona perfectamente para commits
- No expone tu email real en los commits públicos
- GitHub puede vincular los commits a tu cuenta automáticamente

