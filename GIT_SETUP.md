# 🚀 Guía para Publicar en GitHub

## Pasos para Inicializar y Publicar el Repositorio

### 1. Inicializar Git (si no está inicializado)

```bash
cd /Users/santiagolagier/viajes-fran
git init
```

### 2. Agregar Archivos

```bash
# Agregar todos los archivos (excepto los ignorados)
git add .

# Verificar qué se va a commitear
git status
```

### 3. Primer Commit

```bash
git commit -m "feat: initial commit with security improvements and refactoring

- Added backend security (helmet, rate limiting, validation)
- Created centralized config and utils modules
- Added comprehensive documentation
- Improved code organization and maintainability"
```

### 4. Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (ej: `viajes-fran`)
3. **NO** inicialices con README, .gitignore o licencia (ya los tenemos)

### 5. Conectar y Publicar

```bash
# Agregar remote (reemplaza TU-USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU-USUARIO/viajes-fran.git

# O si prefieres SSH:
# git remote add origin git@github.com:TU-USUARIO/viajes-fran.git

# Cambiar a rama main (si estás en master)
git branch -M main

# Publicar código
git push -u origin main
```

### 6. Verificar

Ve a `https://github.com/TU-USUARIO/viajes-fran` y verifica que todos los archivos estén ahí.

---

## ⚠️ IMPORTANTE: Antes de Publicar

### Archivos Sensibles que NO deben subirse:

✅ Ya están en `.gitignore`:
- `backend/config/serviceAccountKey.json` - Credenciales de Firebase
- `.env` - Variables de entorno
- `backend/data/*.db` - Base de datos SQLite
- `node_modules/` - Dependencias

### Verificar que NO estén en el commit:

```bash
# Verificar que .env no se suba
git check-ignore .env
# Debe mostrar: .env

# Verificar que serviceAccountKey.json no se suba
git check-ignore backend/config/serviceAccountKey.json
# Debe mostrar: backend/config/serviceAccountKey.json
```

---

## 📝 Estructura Recomendada de Commits

Para commits futuros, usa esta estructura:

```bash
# Features
git commit -m "feat: agregar funcionalidad X"

# Fixes
git commit -m "fix: corregir bug en Y"

# Refactoring
git commit -m "refactor: modularizar componente Z"

# Documentación
git commit -m "docs: actualizar README"

# Tests
git commit -m "test: agregar tests para módulo X"
```

---

## 🔐 Seguridad

### Antes de hacer push, verifica:

1. ✅ No hay credenciales hardcodeadas
2. ✅ `.env` está en `.gitignore`
3. ✅ `serviceAccountKey.json` está en `.gitignore`
4. ✅ No hay tokens de API en el código
5. ✅ La base de datos no se sube

### Si accidentalmente subiste algo sensible:

```bash
# Remover archivo del historial (CUIDADO: esto reescribe historia)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch RUTA-AL-ARCHIVO" \
  --prune-empty --tag-name-filter cat -- --all

# Luego hacer force push (solo si es necesario)
# git push origin --force --all
```

---

## 📦 Comandos Útiles

```bash
# Ver estado
git status

# Ver cambios
git diff

# Ver historial
git log --oneline

# Crear rama para feature
git checkout -b feature/nombre-feature

# Volver a main
git checkout main

# Mergear rama
git merge feature/nombre-feature

# Actualizar desde GitHub
git pull origin main
```

---

## 🎯 Próximos Pasos Después de Publicar

1. **Agregar descripción al repositorio** en GitHub
2. **Configurar GitHub Pages** (si quieres hosting estático)
3. **Agregar badges** al README (build status, etc.)
4. **Configurar GitHub Actions** para CI/CD
5. **Agregar topics/tags** al repositorio

---

¿Necesitas ayuda con algún paso específico?

