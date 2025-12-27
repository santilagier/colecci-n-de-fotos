# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para que la app funcione en producción.

## Paso 1: Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"**
3. Inicia sesión con GitHub o crea una cuenta con email

## Paso 2: Crear Proyecto

1. Haz clic en **"New Project"**
2. Selecciona tu organización (o crea una)
3. Completa los campos:
   - **Name**: `viajes-fran` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a ti (ej: South America para Argentina)
4. Haz clic en **"Create new project"**
5. Espera ~2 minutos mientras se crea

## Paso 3: Crear la Tabla de Fotos

1. En el menú lateral, ve a **"SQL Editor"**
2. Haz clic en **"New query"**
3. Copia y pega este código:

```sql
-- Crear tabla de fotos
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  date TEXT,
  note_title TEXT,
  note_description TEXT,
  country TEXT,
  country_code TEXT,
  storage_path TEXT,
  thumb_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (muy importante!)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propias fotos
CREATE POLICY "Users can view own photos"
ON photos FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias fotos
CREATE POLICY "Users can insert own photos"
ON photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias fotos
CREATE POLICY "Users can update own photos"
ON photos FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden borrar sus propias fotos
CREATE POLICY "Users can delete own photos"
ON photos FOR DELETE
USING (auth.uid() = user_id);

-- Crear índice para búsquedas por usuario
CREATE INDEX idx_photos_user_id ON photos(user_id);
```

4. Haz clic en **"Run"** (o Ctrl+Enter)
5. Deberías ver: "Success. No rows returned"

## Paso 4: Crear Bucket de Storage

1. En el menú lateral, ve a **"Storage"**
2. Haz clic en **"New bucket"**
3. Configura:
   - **Name**: `photos`
   - **Public bucket**: ❌ NO (déjalo desactivado)
4. Haz clic en **"Create bucket"**

### Configurar Políticas del Bucket

1. Haz clic en el bucket `photos`
2. Ve a la pestaña **"Policies"**
3. Haz clic en **"New Policy"** → **"For full customization"**
4. Crea estas políticas:

**Política 1 - Subir archivos:**
- Policy name: `Allow users to upload own files`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression:
```sql
(bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])
```

**Política 2 - Ver archivos:**
- Policy name: `Allow users to view own files`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
```sql
(bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])
```

**Política 3 - Borrar archivos:**
- Policy name: `Allow users to delete own files`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
(bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1])
```

## Paso 5: Configurar Autenticación

### Magic Link (Email)

1. Ve a **"Authentication"** → **"Providers"**
2. Busca **"Email"** y asegúrate de que está habilitado
3. Configura:
   - **Enable Email Confirmations**: ✅ (recomendado)
   - **Enable Email provider**: ✅

### Google Login

1. Ve a **"Authentication"** → **"Providers"**
2. Busca **"Google"** y haz clic para expandir
3. Activa el toggle **"Enable Google provider"**
4. Necesitarás crear credenciales en Google Cloud Console:

#### Crear Credenciales de Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **"APIs & Services"** → **"Credentials"**
4. Haz clic en **"Create Credentials"** → **"OAuth client ID"**
5. Configura:
   - Application type: **Web application**
   - Name: `Viajes Fran`
   - Authorized JavaScript origins: `https://tu-proyecto.supabase.co`
   - Authorized redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`
6. Copia el **Client ID** y **Client Secret**
7. Pégalos en la configuración de Google en Supabase

## Paso 6: Obtener las Claves de API

1. En Supabase, ve a **"Settings"** (⚙️ en el menú lateral)
2. Haz clic en **"API"**
3. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Paso 7: Configurar la App

1. Abre el archivo `js/supabase-config.js`
2. Reemplaza los valores:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';  // Tu Project URL
const SUPABASE_ANON_KEY = 'eyJhbG...';  // Tu anon public key
```

3. Guarda el archivo

## Paso 8: Configurar URL de Redirección

1. En Supabase, ve a **"Authentication"** → **"URL Configuration"**
2. En **"Site URL"**, pon la URL de tu app en Vercel:
   - `https://tu-app.vercel.app`
3. En **"Redirect URLs"**, añade:
   - `https://tu-app.vercel.app`
   - `http://localhost:8080` (para desarrollo)

## Verificación Final

Tu configuración está completa si:
- ✅ La tabla `photos` existe en Database
- ✅ El bucket `photos` existe en Storage con políticas RLS
- ✅ Google y Email están habilitados en Auth
- ✅ `js/supabase-config.js` tiene tus claves
- ✅ Las URLs de redirección están configuradas

## Solución de Problemas

### Error "Invalid API key"
- Verifica que copiaste correctamente la anon key (es larga)

### Error "User not authenticated"
- Revisa que las políticas RLS estén creadas correctamente

### No llegan los emails de Magic Link
- Revisa la carpeta de spam
- En producción, considera configurar un servicio SMTP personalizado

### Google Login no funciona
- Verifica las URLs de redirección en Google Cloud Console
- Asegúrate de que el Client ID y Secret son correctos

