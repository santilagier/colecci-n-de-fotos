# Recorrido por el Mundo - App de Viajes

Una aplicación web para visualizar tus fotos de viajes en un mapa del mundo, con sincronización en la nube.

## ✨ Características

- **Mapa Interactivo**: Navega por el mundo usando Leaflet con OpenStreetMap
- **Detección Automática de Ubicación**: Lee las coordenadas GPS de las fotos desde sus metadatos EXIF
- **Nombres de Lugares**: Obtiene automáticamente las ciudades y países usando geocodificación
- **Notas y Recuerdos**: Añade títulos y descripciones a cada foto
- **Sincronización en la Nube**: Tus fotos se sincronizan entre dispositivos
- **Autenticación Real**: Login con Google o Magic Link (email)
- **Galería por País**: Visualiza fotos organizadas por país
- **Carrusel de Fotos**: Vista rápida de todas tus fotos
- **Carrusel de Banderas**: Muestra las banderas de los países visitados
- **Diseño Elegante**: Interfaz moderna con tema oscuro

## 🚀 Demo en Vivo

**URL**: (configurar después del deploy en Vercel)

## 📋 Configuración

### 1. Configurar Supabase

La app usa [Supabase](https://supabase.com) para autenticación, base de datos y almacenamiento.

1. Crea una cuenta gratis en [supabase.com](https://supabase.com)
2. Sigue las instrucciones en `SUPABASE_SETUP.md`
3. Copia tus claves en `js/supabase-config.js`

### 2. Deploy en Vercel

La app se despliega fácilmente en [Vercel](https://vercel.com):

1. Conecta tu repositorio de GitHub
2. Vercel detectará automáticamente que es un sitio estático
3. Sigue las instrucciones en `DEPLOY.md`

### 3. Desarrollo Local

```bash
# Servir localmente (requiere Python 3)
python -m http.server 8080

# O con Node.js
npx serve .
```

Luego abre http://localhost:8080

## 🏗️ Arquitectura

```
Frontend (Vercel)          Supabase
┌─────────────────┐       ┌─────────────────┐
│  index.html     │       │  Auth (Google,  │
│  styles.css     │──────▶│  Magic Link)    │
│  app.js         │       │                 │
│  auth.js        │       │  PostgreSQL     │
│                 │       │  (photos table) │
│                 │       │                 │
│                 │       │  Storage Bucket │
│                 │       │  (photos/*)     │
└─────────────────┘       └─────────────────┘
```

## 📁 Estructura del Proyecto

```
viajes-fran/
├── index.html              # HTML principal
├── styles.css              # Estilos
├── app.js                  # Lógica principal
├── auth.js                 # Autenticación con Supabase
├── vercel.json             # Configuración de Vercel
├── js/
│   ├── supabase-config.js  # Configuración de Supabase
│   ├── config.js           # Constantes de la app
│   └── utils.js            # Utilidades
├── SUPABASE_SETUP.md       # Guía de configuración Supabase
├── DEPLOY.md               # Guía de deploy
└── README.md               # Este archivo
```

## 🔐 Seguridad

- **Row Level Security (RLS)**: Cada usuario solo ve sus propias fotos
- **Autenticación OAuth**: Login seguro con Google
- **Storage Privado**: Las fotos se almacenan en bucket privado
- **URLs Firmadas**: Acceso temporal a imágenes

## 📱 Uso

1. **Iniciar Sesión**: Usa Google o Magic Link
2. **Cargar Fotos**: Arrastra o selecciona fotos con GPS
3. **Ver en Mapa**: Las fotos aparecen en sus ubicaciones
4. **Añadir Notas**: Click en una foto para añadir título/descripción
5. **Explorar**: Navega por el mapa o usa los carruseles

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Mapa**: Leaflet.js + OpenStreetMap
- **Metadatos EXIF**: exif-js
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Hosting**: Vercel

## 💡 Tips

- Las fotos deben tener datos GPS en sus metadatos EXIF
- La mayoría de fotos de smartphones tienen GPS activado
- Fotos sin GPS pueden asignarse manualmente a una ciudad
- Usa el backup (Ajustes → Exportar) para respaldar tus datos

---

Hecho con ❤️ para Fran
