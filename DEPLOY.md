# Guía de Deploy - Viajes Fran

Esta guía te ayudará a publicar la app en línea usando Vercel (gratis).

## Requisitos Previos

1. **Cuenta de GitHub** - Ya la tienes (tu código está en: https://github.com/santilagier/colecci-n-de-fotos)
2. **Cuenta de Supabase** - Ver `SUPABASE_SETUP.md` para configurarlo
3. **Cuenta de Vercel** - Gratis en https://vercel.com

## Paso 1: Configurar Supabase

Antes de hacer deploy, asegúrate de tener Supabase configurado:

1. Sigue los pasos en `SUPABASE_SETUP.md`
2. Actualiza `js/supabase-config.js` con tus claves:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

3. Haz commit y push de los cambios

## Paso 2: Crear Cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Elige **"Continue with GitHub"**
4. Autoriza Vercel para acceder a tu cuenta de GitHub

## Paso 3: Importar Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Busca tu repositorio: `colecci-n-de-fotos`
3. Haz clic en **"Import"**

## Paso 4: Configurar Deploy

En la página de configuración:

1. **Framework Preset**: Selecciona `Other` (es un sitio estático)
2. **Root Directory**: Déjalo vacío (es la raíz)
3. **Build Command**: Déjalo vacío (no hay build)
4. **Output Directory**: Déjalo vacío

5. Haz clic en **"Deploy"**

## Paso 5: Esperar el Deploy

- Vercel construirá y desplegará tu app
- Toma unos 30-60 segundos
- Al terminar, verás un link como: `https://colecci-n-de-fotos.vercel.app`

## Paso 6: Configurar URL en Supabase

¡IMPORTANTE! Después del deploy:

1. Ve a tu proyecto en Supabase
2. Ve a **Authentication** → **URL Configuration**
3. En **Site URL**, pon tu URL de Vercel:
   - `https://tu-proyecto.vercel.app`
4. En **Redirect URLs**, agrega:
   - `https://tu-proyecto.vercel.app`
   - `http://localhost:8080` (para desarrollo local)

Esto es necesario para que el login funcione correctamente.

## Paso 7: Probar

1. Abre tu URL de Vercel
2. Prueba el login con Google o Magic Link
3. Sube algunas fotos
4. ¡Listo!

---

## Deploy Automático

Una vez configurado, cada vez que hagas `git push` a tu repositorio, Vercel automáticamente re-desplegará tu app con los cambios.

## Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio (ej: `viajes.tudominio.com`):

1. En Vercel, ve a tu proyecto → **Settings** → **Domains**
2. Añade tu dominio
3. Sigue las instrucciones para configurar DNS

## Solución de Problemas

### Error "Invalid API key"
- Verifica que `js/supabase-config.js` tiene las claves correctas
- Haz commit y push después de cambiar las claves

### Login no funciona
- Revisa que las URLs de redirección estén configuradas en Supabase
- Asegúrate de usar HTTPS (no HTTP) en producción

### Fotos no se cargan
- Verifica que el bucket de Storage está creado en Supabase
- Revisa las políticas RLS del bucket

### Error 404
- Asegúrate de que `index.html` está en la raíz del proyecto

## Comandos Útiles

```bash
# Ver estado del deploy
vercel

# Deploy manual (si no usas GitHub integration)
vercel --prod

# Ver logs
vercel logs tu-proyecto
```

---

¡Tu app está en línea! 🎉

