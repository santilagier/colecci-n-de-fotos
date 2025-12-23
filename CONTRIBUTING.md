# 🤝 Guía de Contribución
## Viajes Fran

¡Gracias por tu interés en contribuir! Esta guía te ayudará a hacer contribuciones de calidad.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Estándares de Código](#estándares-de-código)
4. [Proceso de Pull Request](#proceso-de-pull-request)
5. [Reporte de Bugs](#reporte-de-bugs)
6. [Sugerencias de Features](#sugerencias-de-features)

---

## 🌟 Código de Conducta

- Sé respetuoso con otros contribuidores
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Muestra empatía hacia otros miembros

---

## 🚀 Cómo Contribuir

### 1. Fork el Repositorio

```bash
git clone https://github.com/tu-usuario/viajes-fran.git
cd viajes-fran
```

### 2. Crea una Rama

```bash
# Para features
git checkout -b feature/nombre-descriptivo

# Para fixes
git checkout -b fix/nombre-descriptivo

# Para refactoring
git checkout -b refactor/nombre-descriptivo
```

### 3. Haz tus Cambios

Sigue los estándares de código descritos abajo.

### 4. Commit

```bash
git add .
git commit -m "tipo: descripción corta

Descripción más detallada si es necesario.

Refs #123"
```

**Tipos de commit:**
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Solo documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización
- `perf`: Mejora de performance
- `test`: Agregar/modificar tests
- `chore`: Mantenimiento

### 5. Push y PR

```bash
git push origin tu-rama
```

Luego crea un Pull Request en GitHub.

---

## 📏 Estándares de Código

### JavaScript

#### Naming Conventions

```javascript
// Variables y funciones: camelCase
const photoUrl = 'https://...';
function getPhotoData() { }

// Constantes: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Clases: PascalCase
class PhotoManager { }

// Archivos: kebab-case
// photo-utils.js, api-client.js
```

#### Funciones

```javascript
// ✅ Bueno: Función pequeña, un propósito
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ❌ Malo: Función muy larga, múltiples responsabilidades
function handlePhotoUploadAndSaveAndShowGalleryAndUpdateStats() {
    // ... 100+ líneas
}
```

#### Comentarios

```javascript
/**
 * Convierte coordenadas DMS a decimal
 * @param {Array} dms - [grados, minutos, segundos]
 * @param {string} ref - Dirección (N, S, E, W)
 * @returns {number} Grados decimales
 */
function convertDMSToDD(dms, ref) {
    // Implementación
}
```

#### Error Handling

```javascript
// ✅ Bueno
try {
    const data = await fetchData();
    return processData(data);
} catch (error) {
    console.error('Error fetching data:', error);
    showErrorMessage('No se pudieron cargar los datos');
    return null;
}

// ❌ Malo
try {
    const data = await fetchData();
    return processData(data);
} catch (error) {
    // Error silenciado
}
```

#### Async/Await

```javascript
// ✅ Bueno: Async/await con error handling
async function loadPhotos() {
    try {
        const photos = await api.getPhotos();
        displayPhotos(photos);
    } catch (error) {
        handleError(error);
    }
}

// ❌ Malo: Promise sin error handling
function loadPhotos() {
    api.getPhotos().then(photos => {
        displayPhotos(photos);
    });
}
```

### CSS

```css
/* ✅ Bueno: Variables CSS, nombres descriptivos */
:root {
    --primary-color: #28cdff;
    --spacing-md: 20px;
}

.photo-carousel-item {
    background: var(--primary-color);
    padding: var(--spacing-md);
}

/* ❌ Malo: Valores mágicos, nombres vagos */
.item {
    background: #28cdff;
    padding: 20px;
}
```

### HTML

```html
<!-- ✅ Bueno: Semántico, accesible -->
<article class="photo-item" role="article" aria-label="Foto de viaje">
    <img src="..." alt="Descripción de la foto" loading="lazy">
    <button aria-label="Editar nota de foto">
        <svg aria-hidden="true">...</svg>
    </button>
</article>

<!-- ❌ Malo: No semántico, sin accesibilidad -->
<div class="item">
    <img src="...">
    <div onclick="edit()">
        <svg>...</svg>
    </div>
</div>
```

### Node.js/Backend

```javascript
// ✅ Bueno: Validación, error handling, logging
app.post('/api/photos', validatePhotoCreate, async (req, res) => {
    try {
        const photo = await createPhoto(req.body);
        console.log(`Photo created: ${photo.id}`);
        res.status(201).json({ photo });
    } catch (error) {
        console.error('Error creating photo:', error);
        res.status(500).json({ error: 'Failed to create photo' });
    }
});

// ❌ Malo: Sin validación, error handling pobre
app.post('/api/photos', async (req, res) => {
    const photo = await createPhoto(req.body);
    res.json({ photo });
});
```

---

## 🔍 Proceso de Pull Request

### Checklist Antes de Abrir PR

- [ ] El código sigue los estándares de estilo
- [ ] Los tests pasan (cuando existan)
- [ ] La documentación está actualizada
- [ ] Los commits tienen mensajes descriptivos
- [ ] No hay console.logs innecesarios
- [ ] No hay código comentado
- [ ] No hay TODOs sin issue asociado

### Descripción del PR

```markdown
## Descripción
Breve descripción de qué cambia este PR y por qué.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Refactorización
- [ ] Mejora de performance
- [ ] Actualización de documentación

## ¿Cómo se ha testeado?
Describe las pruebas que corriste.

## Screenshots (si aplica)
Agrega screenshots si hay cambios visuales.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He comentado áreas complejas
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan warnings
- [ ] He agregado tests que prueban mi fix/feature
- [ ] Todos los tests pasan localmente
```

### Proceso de Revisión

1. **Automatic Checks**
   - Linting pasa ✅
   - Tests pasan ✅
   - Build exitoso ✅

2. **Code Review**
   - Al menos 1 aprobación requerida
   - Todos los comentarios resueltos
   - Sin conflictos con main

3. **Merge**
   - Squash and merge para features
   - Rebase para fixes pequeños

---

## 🐛 Reporte de Bugs

### Template de Issue

```markdown
**Descripción del Bug**
Una descripción clara y concisa del bug.

**Para Reproducir**
Pasos para reproducir:
1. Ve a '...'
2. Haz click en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado**
Descripción clara de qué esperabas que pasara.

**Screenshots**
Si aplica, agrega screenshots.

**Información Adicional:**
 - OS: [e.g. iOS, Windows]
 - Browser [e.g. chrome, safari]
 - Versión [e.g. 22]

**Contexto Adicional**
Cualquier otro contexto sobre el problema.
```

---

## 💡 Sugerencias de Features

### Template de Issue

```markdown
**¿Tu feature request está relacionada con un problema?**
Una descripción clara del problema. Ej: Siempre me frustra cuando [...]

**Describe la solución que te gustaría**
Una descripción clara y concisa de qué quieres que pase.

**Describe alternativas que consideraste**
Descripción de soluciones alternativas o features que consideraste.

**Contexto adicional**
Cualquier otro contexto o screenshots sobre la feature.

**¿Estarías dispuesto a contribuir esta feature?**
- [ ] Sí, puedo enviar un PR
- [ ] No, solo sugiero la idea
```

---

## 📚 Recursos Útiles

### Documentación

- [README](./README.md) - Información general
- [SETUP](./SETUP.md) - Configuración inicial
- [STORAGE_SETUP](./STORAGE_SETUP.md) - Setup de Firebase
- [REFACTORING_REPORT](./REFACTORING_REPORT.md) - Decisiones arquitectónicas

### Herramientas

- [ESLint](https://eslint.org/) - Linting JavaScript
- [Prettier](https://prettier.io/) - Formateo de código
- [Jest](https://jestjs.io/) - Testing (cuando se implemente)

### Guías de Estilo

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

---

## 🎯 Prioridades Actuales

Áreas donde más necesitamos ayuda:

### Alta Prioridad
1. **Testing** - Agregar tests unitarios y de integración
2. **Modularización** - Refactorizar `app.js` en módulos
3. **Performance** - Optimizar carga de imágenes

### Media Prioridad
4. **Documentación** - Documentar API endpoints
5. **Accesibilidad** - Mejorar a11y
6. **Internacionalización** - Agregar i18n

### Baja Prioridad
7. **Features** - PWA, offline sync
8. **UI/UX** - Mejoras visuales

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito experiencia previa con Firebase?**  
R: No necesariamente. Hay buena documentación y ejemplos en el código.

**P: ¿Cómo configuro el entorno de desarrollo?**  
R: Sigue la guía en [SETUP.md](./SETUP.md)

**P: ¿Cuánto tiempo toma revisar un PR?**  
R: Generalmente 1-3 días hábiles.

**P: ¿Puedo trabajar en múltiples issues a la vez?**  
R: Es mejor enfocarse en uno para evitar conflictos.

---

## 📬 Contacto

Si tienes preguntas, puedes:
- Abrir un issue
- Comentar en un PR existente
- Enviar mensaje a los maintainers

---

**¡Gracias por contribuir a Viajes Fran! 🌍📸**

