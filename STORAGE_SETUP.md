# Configuración de Firebase Storage

## Paso 1: Crear Proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Storage** en el proyecto:
   - Ve a "Storage" en el menú lateral
   - Haz clic en "Get started"
   - Selecciona "Start in production mode" (o "Start in test mode" para desarrollo)
   - Elige una ubicación para el bucket

## Paso 2: Obtener Credenciales

1. Ve a **Project Settings** (ícono de engranaje) > **Service Accounts**
2. Haz clic en **"Generate new private key"**
3. Descarga el archivo JSON (contiene las credenciales)

## Paso 3: Configurar Backend

**Opción A: Archivo de credenciales** (recomendado para desarrollo):

1. Copia el archivo JSON descargado a:
   ```
   backend/config/serviceAccountKey.json
   ```

2. El backend lo detectará automáticamente

**Opción B: Variables de entorno** (recomendado para producción):

1. Copia `.env.example` a `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Abre el archivo JSON descargado y completa `.env`:
   ```env
   FIREBASE_PROJECT_ID=tu-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_STORAGE_BUCKET=tu-project-id.appspot.com
   ```

   **Importante**: El `FIREBASE_PRIVATE_KEY` debe incluir los `\n` literales (no saltos de línea reales).

## Paso 4: Configurar Reglas de Storage

En Firebase Console > Storage > Rules, configura:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Solo el backend puede escribir
    // Las URLs firmadas permiten lectura temporal
    match /photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null || request.query.token != null;
      allow write: if false; // Solo desde backend
    }
  }
}
```

**Nota**: Como estamos usando URLs firmadas desde el backend, las reglas pueden ser más restrictivas. El backend maneja la autenticación.

## Paso 5: Instalar Dependencias y Ejecutar

```bash
cd backend
npm install
npm run migrate
npm start
```

## Verificación

1. El backend debería mostrar: `✅ Firebase Admin initialized`
2. Si ves: `⚠️ Firebase not configured`, revisa los pasos anteriores
3. Prueba subir una foto desde la app - debería aparecer en Firebase Storage

## Estructura en Storage

Las fotos se guardan en:
```
photos/
  {userId}/
    {timestamp}-{filename}.jpg        (imagen original)
    {timestamp}-thumb-{filename}.jpg  (miniatura)
```

## Troubleshooting

- **Error: "Firebase Storage not configured"**: Verifica que el archivo `serviceAccountKey.json` esté en `backend/config/` o que las variables de entorno estén configuradas
- **Error: "Permission denied"**: Verifica las reglas de Storage en Firebase Console
- **Error: "Bucket not found"**: Verifica que `FIREBASE_STORAGE_BUCKET` sea correcto (generalmente `project-id.appspot.com`)

