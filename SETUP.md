# Setup - Sincronización con Base de Datos

## Requisitos Previos

- Node.js (v14 o superior)
- npm

## Instalación del Backend

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la migración para crear la base de datos:
```bash
npm run migrate
```

4. Inicia el servidor:
```bash
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## Configuración de la App

La app está configurada para conectarse automáticamente al backend en `http://localhost:3000`.

Si el backend no está corriendo, la app funcionará en modo offline (solo localStorage).

## Cómo Funciona

### Al Cargar una Foto:

1. **Localmente**: La imagen se guarda en `localStorage` (comprimida)
2. **En la Nube**: Se sube solo el registro (metadatos) a la DB:
   - `location`, `lat`, `lon`, `date`
   - `noteTitle`, `noteDescription`
   - `country`, `countryCode`
   - `hasImage: false` (las imágenes no se suben)

### En Otro Dispositivo:

1. Al iniciar sesión, la app carga fotos desde:
   - **localStorage** (si hay fotos locales con imágenes)
   - **Base de datos** (fotos de otros dispositivos, sin imágenes)

2. Las fotos sin imagen se muestran con un placeholder indicando que fueron cargadas desde otro dispositivo.

3. Puedes ver y editar las notas, ubicaciones, fechas, etc., aunque la imagen no esté disponible.

## Estructura de la Base de Datos

### Tabla `photos`

```sql
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    location TEXT,
    lat REAL,
    lon REAL,
    date TEXT,
    noteTitle TEXT,
    noteDescription TEXT,
    country TEXT,
    countryCode TEXT,
    hasImage BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/photos?userId=xxx` - Obtiene todas las fotos de un usuario
- `POST /api/photos` - Crea un nuevo registro de foto
- `PUT /api/photos/:id` - Actualiza un registro de foto
- `DELETE /api/photos/:id?userId=xxx` - Elimina una foto
- `DELETE /api/photos?userId=xxx&all=true` - Elimina todas las fotos de un usuario

## Testing

1. **Dispositivo 1**: 
   - Inicia sesión
   - Carga algunas fotos
   - Agrega notas
   - Verifica que aparezcan en la DB

2. **Dispositivo 2** (o mismo dispositivo, otra sesión):
   - Inicia sesión con el mismo email
   - Deberías ver las fotos (sin imágenes) con sus notas y ubicaciones
   - Puedes editar las notas y se sincronizarán

## Troubleshooting

- **No se cargan fotos desde la nube**: Verifica que el backend esté corriendo y que `ENABLE_CLOUD_SYNC = true` en `app.js`
- **Error de CORS**: El backend ya tiene CORS habilitado, pero si tienes problemas, verifica que el puerto sea 3000
- **Fotos no se sincronizan**: Revisa la consola del navegador para ver errores de red

