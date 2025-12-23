# Viajes Fran - Backend API

Backend para sincronización de fotos entre dispositivos con almacenamiento en la nube.

## Instalación

```bash
npm install
```

## Configuración de Firebase Storage

1. **Crear proyecto en Firebase Console**:
   - Ve a https://console.firebase.google.com
   - Crea un nuevo proyecto o usa uno existente
   - Habilita "Storage" en el proyecto

2. **Obtener credenciales de servicio**:
   - Ve a Project Settings > Service Accounts
   - Haz clic en "Generate new private key"
   - Descarga el archivo JSON

3. **Configurar credenciales** (elige una opción):

   **Opción A: Archivo de credenciales** (recomendado para desarrollo):
   - Copia el archivo JSON descargado a `config/serviceAccountKey.json`
   
   **Opción B: Variables de entorno**:
   - Copia `.env.example` a `.env`
   - Completa las variables con los valores del archivo JSON:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY` (con los `\n` incluidos)
     - `FIREBASE_STORAGE_BUCKET` (generalmente `project-id.appspot.com`)

4. **Configurar Storage Bucket**:
   - En Firebase Console > Storage > Rules
   - Configura reglas para acceso privado (las URLs firmadas manejarán el acceso)

## Instalación y Uso

1. Ejecutar migración para crear la base de datos:
```bash
npm run migrate
```

2. Iniciar el servidor:
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Verifica que el servidor esté funcionando

### Fotos
- `GET /api/photos?userId=xxx` - Obtiene todas las fotos de un usuario
- `POST /api/photos` - Crea un nuevo registro de foto
- `PUT /api/photos/:id` - Actualiza un registro de foto
- `DELETE /api/photos/:id?userId=xxx` - Elimina una foto
- `DELETE /api/photos?userId=xxx&all=true` - Elimina todas las fotos de un usuario

## Estructura de la Base de Datos

### Tabla `photos`
- `id` - INTEGER PRIMARY KEY
- `user_id` - TEXT NOT NULL
- `location` - TEXT
- `lat` - REAL
- `lon` - REAL
- `date` - TEXT
- `noteTitle` - TEXT
- `noteDescription` - TEXT
- `country` - TEXT
- `countryCode` - TEXT
- `hasImage` - BOOLEAN (true si tiene imagen en storage)
- `storage_path` - TEXT (ruta del archivo en Firebase Storage)
- `thumb_path` - TEXT (ruta de la miniatura en Firebase Storage)
- `createdAt` - DATETIME
- `updatedAt` - DATETIME

## API Endpoints

### Fotos
- `GET /api/photos?userId=xxx` - Obtiene todas las fotos con URLs firmadas
- `POST /api/photos` - Crea un nuevo registro de foto con upload de archivo (multipart/form-data)
- `GET /api/photos/:id/url?userId=xxx&thumb=true` - Obtiene URL firmada para una foto específica
- `PUT /api/photos/:id` - Actualiza un registro de foto
- `DELETE /api/photos/:id?userId=xxx` - Elimina una foto y sus archivos de storage
- `DELETE /api/photos?userId=xxx&all=true` - Elimina todas las fotos y archivos

## Notas

- Las imágenes se suben directamente a Firebase Storage (File/Blob, no dataURL)
- Se generan miniaturas automáticamente (300px de ancho)
- Las URLs son firmadas y expiran después de 1 hora (configurable)
- El bucket es privado - solo se accede mediante URLs firmadas

