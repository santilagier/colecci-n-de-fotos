# 🔐 Por Qué Falla la Autenticación en GitHub

## ⚠️ RAZÓN PRINCIPAL: GitHub Ya NO Acepta Contraseñas

**Desde agosto de 2021, GitHub eliminó el soporte para usar tu contraseña normal en Git.**

Esto significa que:
- ❌ **NO puedes usar** tu contraseña de GitHub para hacer `git push`
- ✅ **DEBES usar** un Personal Access Token (PAT)
- ✅ O usar SSH keys

---

## 🎯 Razones Comunes por las que Falla

### 1. Estás Usando tu Contraseña en vez del Token

**Síntoma:**
```
remote: Support for password authentication was removed on August 13, 2021.
fatal: Authentication failed
```

**Solución:**
- NO uses tu contraseña de GitHub
- Usa un Personal Access Token (ver GUIA_TOKEN_GITHUB.md)

---

### 2. El Token No Tiene los Permisos Correctos

**Síntoma:**
```
remote: Permission denied (publickey).
fatal: unable to access 'https://github.com/...': The requested URL returned error: 403
```

**Solución:**
- El token DEBE tener el scope `repo` marcado
- Ve a: https://github.com/settings/tokens
- Verifica que tu token tenga ✅ `repo` (Full control of private repositories)
- Si no lo tiene, crea un nuevo token con ese permiso

---

### 3. El Token Está Expirado o Fue Revocado

**Síntoma:**
```
fatal: Authentication failed
```

**Solución:**
- Ve a: https://github.com/settings/tokens
- Verifica que el token aún exista y no esté revocado
- Si expiró o fue revocado, crea uno nuevo

---

### 4. Tienes 2FA (Autenticación de Dos Factores) Activada

**Síntoma:**
- Te pide un código adicional
- O falla la autenticación

**Solución:**
- Si tienes 2FA activada, DEBES usar un token (no tu contraseña)
- El token reemplaza la necesidad de 2FA para Git
- Crea un token con permisos `repo`

---

### 5. El Formato del Token Está Mal

**Síntoma:**
```
fatal: Authentication failed
```

**Formato Correcto:**
- Los tokens nuevos empiezan con: `github_pat_...`
- Los tokens antiguos empiezan con: `ghp_...`
- Deben tener ~40-50 caracteres de largo

**Solución:**
- Asegúrate de copiar TODO el token (es muy largo)
- No debe tener espacios al inicio o final
- Si usas el token en la URL, el formato es:
  ```
  https://usuario:TOKEN@github.com/usuario/repo.git
  ```

---

### 6. El Repositorio No Existe o No Tienes Acceso

**Síntoma:**
```
remote: Repository not found.
fatal: repository 'https://github.com/...' not found
```

**Solución:**
- Verifica que el repositorio existe: https://github.com/santilagier/colecci-n-de-fotos
- Verifica que tienes acceso de escritura al repositorio
- El nombre del repositorio debe ser exacto (con guiones, sin espacios)

---

### 7. Problema con el Cache de Credenciales

**Síntoma:**
- Git sigue usando credenciales viejas/incorrectas

**Solución en Mac:**

```bash
# Limpiar credenciales guardadas
git credential-osxkeychain erase
host=github.com
protocol=https
# Presiona Enter dos veces

# O eliminar todas las credenciales de GitHub
git credential reject <<EOF
protocol=https
host=github.com
EOF
```

---

## ✅ Solución Paso a Paso

### Método 1: Usar Token en la Terminal (Recomendado)

1. **Crea un token** (ver GUIA_TOKEN_GITHUB.md)
   - Asegúrate de marcar ✅ `repo`

2. **En la Terminal, escribe:**

```bash
cd /Users/santiagolagier/viajes-fran

# Opción A: Push directo con token en la URL
git push https://santilagier:TU_TOKEN_AQUI@github.com/santilagier/colecci-n-de-fotos.git main

# Opción B: Push normal (te pedirá usuario y contraseña)
git push -u origin main
# Username: santilagier
# Password: [pega tu TOKEN, NO tu contraseña]
```

### Método 2: Guardar el Token en Git Credential Helper

```bash
# Configurar Git para guardar credenciales
git config --global credential.helper osxkeychain

# Hacer push (te pedirá usuario y token una vez, luego lo guarda)
git push -u origin main
# Username: santilagier
# Password: [pega tu TOKEN]
```

### Método 3: Usar SSH (Más Seguro a Largo Plazo)

```bash
# Generar clave SSH (si no tienes una)
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Copiar la clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar la clave en GitHub:
# 1. Ve a: https://github.com/settings/keys
# 2. Clic en "New SSH key"
# 3. Pega la clave pública
# 4. Guarda

# Cambiar remote a SSH
git remote set-url origin git@github.com:santilagier/colecci-n-de-fotos.git

# Hacer push
git push -u origin main
```

---

## 🔍 Cómo Verificar Qué Está Pasando

### Ver el Error Completo

```bash
# Hacer push con más información de debug
GIT_CURL_VERBOSE=1 GIT_TRACE=1 git push -u origin main
```

Esto te mostrará exactamente qué está fallando.

### Verificar el Remote

```bash
# Ver la URL configurada
git remote -v

# Debe mostrar:
# origin  https://github.com/santilagier/colecci-n-de-fotos.git (fetch)
# origin  https://github.com/santilagier/colecci-n-de-fotos.git (push)
```

### Verificar que el Token Funciona

```bash
# Probar el token directamente
curl -H "Authorization: token TU_TOKEN_AQUI" https://api.github.com/user

# Si funciona, deberías ver tu información de usuario en JSON
```

---

## 🎯 Checklist de Verificación

Antes de intentar hacer push, verifica:

- [ ] ✅ Tienes un Personal Access Token creado
- [ ] ✅ El token tiene el scope `repo` marcado
- [ ] ✅ El token NO ha expirado
- [ ] ✅ Estás usando el TOKEN como contraseña (no tu contraseña de GitHub)
- [ ] ✅ El nombre de usuario es correcto: `santilagier`
- [ ] ✅ El nombre del repositorio es correcto: `colecci-n-de-fotos`
- [ ] ✅ El repositorio existe en GitHub
- [ ] ✅ Tienes permisos de escritura en el repositorio

---

## 🆘 Si Nada Funciona

### Opción 1: Crear un Token Nuevo

1. Ve a: https://github.com/settings/tokens
2. Revoca todos los tokens viejos
3. Crea un token NUEVO con:
   - Nombre: `Viajes Fran - Push`
   - Expiración: `No expiration` (para evitar problemas)
   - Permisos: ✅ `repo` (marca SOLO esta)
4. Copia el token
5. Intenta hacer push de nuevo

### Opción 2: Usar GitHub Desktop

Si la terminal te da problemas, puedes usar GitHub Desktop:
1. Descarga: https://desktop.github.com/
2. Abre el repositorio desde GitHub Desktop
3. Haz clic en "Publish branch" o "Push origin"

### Opción 3: Subir Archivos Manualmente

Como último recurso:
1. Ve a: https://github.com/santilagier/colecci-n-de-fotos
2. Haz clic en "uploading an existing file"
3. Arrastra tus archivos
4. Haz commit

---

## 💡 Consejos Finales

1. **Nunca uses tu contraseña de GitHub** para Git (ya no funciona)
2. **Siempre usa un token** con permisos `repo`
3. **Guarda el token de forma segura** (no lo compartas)
4. **Si el token expira**, crea uno nuevo
5. **Usa "No expiration"** si no quieres que expire

---

## 📞 Resumen

**La razón más común por la que falla:**
- Estás usando tu **contraseña** en vez del **token**
- O el token **no tiene el permiso `repo`**

**Solución:**
1. Crea un token nuevo con permiso `repo`
2. Úsalo como contraseña cuando Git te la pida
3. O úsalo directamente en la URL del push

---

¿Necesitas ayuda con algún paso específico?

