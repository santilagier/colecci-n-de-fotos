# 🔑 Guía Paso a Paso: Crear Token de GitHub
## Para personas no técnicas

Esta guía te ayudará a crear un token de acceso personal en GitHub para poder subir tu código.

---

## 📋 Paso 1: Abrir GitHub

1. Abre tu navegador (Chrome, Safari, Firefox, etc.)
2. Ve a: **https://github.com**
3. **Inicia sesión** con tu cuenta (si no estás logueado)

---

## 📋 Paso 2: Ir a Configuración de Tokens

1. Haz clic en tu **foto de perfil** (arriba a la derecha)
2. En el menú que aparece, haz clic en **"Settings"** (Configuración)

   ![Paso 2: Menú de usuario](https://i.imgur.com/placeholder.png)
   *Busca "Settings" en el menú desplegable*

---

## 📋 Paso 3: Ir a Developer Settings

1. En el menú de la izquierda, busca la sección **"Developer settings"**
2. Haz clic en **"Developer settings"**

   ![Paso 3: Developer settings](https://i.imgur.com/placeholder.png)
   *Está al final del menú izquierdo*

---

## 📋 Paso 4: Ir a Personal Access Tokens

1. Dentro de "Developer settings", verás dos opciones:
   - **"Personal access tokens"**
   - **"Fine-grained tokens"** (nuevo)

2. Haz clic en **"Personal access tokens"** → **"Tokens (classic)"**

   ![Paso 4: Personal access tokens](https://i.imgur.com/placeholder.png)
   *Haz clic en "Tokens (classic)"*

---

## 📋 Paso 5: Generar Nuevo Token

1. Verás un botón que dice **"Generate new token"**
2. Haz clic en **"Generate new token"**
3. Luego selecciona **"Generate new token (classic)"**

   ![Paso 5: Generate new token](https://i.imgur.com/placeholder.png)
   *Botón verde "Generate new token"*

---

## 📋 Paso 6: Configurar el Token

### 6.1. Nombre del Token
- En el campo **"Note"** (Nota), escribe: `Viajes Fran - Push Code`
- Esto es solo para recordar para qué es el token

### 6.2. Expiración
- En **"Expiration"**, elige:
  - **"90 days"** (90 días) - Recomendado
  - O **"No expiration"** (Sin expiración) - Si quieres que nunca expire

### 6.3. Permisos (MUY IMPORTANTE)
- Busca la sección **"Select scopes"** (Seleccionar permisos)
- **Marca la casilla** que dice: ✅ **`repo`**
  - Esto te da: "Full control of private repositories"
  - Es el permiso que necesitas para subir código

   ![Paso 6: Permisos](https://i.imgur.com/placeholder.png)
   *Marca SOLO la casilla "repo"*

### 6.4. Generar
- Haz clic en el botón verde **"Generate token"** (al final de la página)

---

## 📋 Paso 7: Copiar el Token

⚠️ **MUY IMPORTANTE: Este es el ÚNICO momento en que verás el token completo**

1. GitHub te mostrará un token que empieza con: `ghp_` o `github_pat_`
2. **Copia TODO el token** (es muy largo, asegúrate de copiarlo completo)
3. **Guárdalo en un lugar seguro** (notas, documento de texto, etc.)

   ![Paso 7: Token generado](https://i.imgur.com/placeholder.png)
   *Copia TODO el token que aparece*

4. **NO cierres esta página** hasta haber copiado el token
5. Si cierras la página, **NO podrás ver el token de nuevo** y tendrás que crear uno nuevo

---

## 📋 Paso 8: Usar el Token

Ahora que tienes el token, puedes usarlo para hacer push:

### Opción A: En la Terminal (Mac)

1. Abre la **Terminal** (búscala en Aplicaciones → Utilidades)
2. Escribe estos comandos uno por uno:

```bash
cd /Users/santiagolagier/viajes-fran
```

3. Luego escribe:

```bash
git push -u origin main
```

4. Te pedirá:
   - **Username:** Escribe: `santilagier`
   - **Password:** Pega tu token (NO tu contraseña de GitHub, sino el token que copiaste)

### Opción B: Usar el Token Directamente

En la Terminal, escribe (reemplaza TU_TOKEN con el token que copiaste):

```bash
cd /Users/santiagolagier/viajes-fran
git push https://santilagier:TU_TOKEN@github.com/santilagier/colecci-n-de-fotos.git main
```

---

## ✅ Verificar que Funcionó

1. Ve a: **https://github.com/santilagier/colecci-n-de-fotos**
2. Deberías ver todos tus archivos ahí
3. Si ves los archivos, ¡funcionó! 🎉

---

## 🔒 Seguridad del Token

### ⚠️ IMPORTANTE: Trata el token como una contraseña

- ❌ **NO** lo compartas públicamente
- ❌ **NO** lo subas a GitHub en archivos de código
- ❌ **NO** lo publiques en chats públicos
- ✅ **SÍ** guárdalo en un lugar seguro y privado
- ✅ **SÍ** revócalo si crees que alguien más lo tiene

### Si necesitas revocar un token:

1. Ve a: **https://github.com/settings/tokens**
2. Encuentra el token que quieres revocar
3. Haz clic en el botón **"Revoke"** (Revocar)
4. Confirma la acción

---

## 🆘 Problemas Comunes

### "Permission denied" (Permiso denegado)
- **Solución:** Asegúrate de haber marcado la casilla `repo` en los permisos
- Crea un nuevo token con el permiso `repo` marcado

### "Token not found" (Token no encontrado)
- **Solución:** El token expiró o fue revocado
- Crea un nuevo token siguiendo los pasos de arriba

### "Repository not found" (Repositorio no encontrado)
- **Solución:** Verifica que el nombre del repositorio sea correcto
- Debe ser: `colecci-n-de-fotos`

### No puedo ver el token después de crearlo
- **Solución:** GitHub solo muestra el token UNA VEZ
- Si lo perdiste, debes crear un nuevo token

---

## 📸 Imágenes de Referencia

### Vista del Menú de Usuario
```
┌─────────────────────────┐
│  [Tu Foto]  ▼          │  ← Haz clic aquí
│                         │
│  Your profile           │
│  Your repositories      │
│  Your codespaces        │
│  Settings          ←───┼── Haz clic aquí
│  Sign out              │
└─────────────────────────┘
```

### Vista de Developer Settings
```
┌─────────────────────────┐
│  Settings               │
│  ├─ Profile             │
│  ├─ Account              │
│  ├─ ...                  │
│  └─ Developer settings ←─┼── Haz clic aquí
│     ├─ Personal access   │
│     │  tokens            │
│     └─ Fine-grained     │
│        tokens            │
└─────────────────────────┘
```

### Vista de Permisos (Scopes)
```
┌─────────────────────────┐
│  Select scopes          │
│                         │
│  ☐ admin:repo_hook      │
│  ☐ delete_repo          │
│  ☐ repo          ←─────┼── Marca ESTA casilla ✅
│  ☐ workflow             │
│  ☐ write:packages       │
│                         │
│  [Generate token]       │
└─────────────────────────┘
```

---

## 🎯 Resumen Rápido

1. **GitHub.com** → Tu foto → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → **Generate new token (classic)**
4. Nombre: `Viajes Fran - Push Code`
5. Expiración: **90 days** (o No expiration)
6. Permisos: Marca ✅ **`repo`**
7. **Generate token**
8. **Copia el token** (solo lo verás una vez)
9. Úsalo como contraseña cuando hagas `git push`

---

## 💡 Tip Final

Si tienes problemas, puedes:
- Crear un token nuevo (no hay límite)
- Usar "No expiration" para que no expire nunca
- Guardar el token en un documento de texto seguro

---

**¿Tienes dudas?** Revisa cada paso con calma. El proceso es seguro y GitHub te guiará en cada paso.

