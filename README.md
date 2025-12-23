# Nuestros Viajes - App de Mapa Interactivo

Una aplicación web elegante para visualizar tus fotos en un mapa del mundo basándose en sus datos GPS (metadata EXIF).

## 🎯 Características

- **Mapa Interactivo**: Navega por el mundo usando Leaflet con OpenStreetMap
- **Detección Automática de Ubicación**: Lee automáticamente las coordenadas GPS de las fotos desde sus metadatos EXIF
- **Nombres de Lugares**: Obtiene automáticamente los nombres de las ciudades y países usando geocodificación inversa
- **Marcadores Inteligentes**: Agrupa fotos por ubicación y muestra el número de fotos en cada lugar
- **Galería de Fotos**: Haz click en cualquier marcador para ver todas las fotos de esa ubicación
- **Drag and Drop**: Arrastra fotos directamente al área de drop
- **Persistencia Local**: Las fotos se guardan automáticamente en tu navegador y se cargan al volver
- **Diseño Elegante**: Interfaz moderna con fondo negro, tipografía Space Grotesk y contornos cian
- **Estadísticas**: Muestra el total de fotos, lugares y países visitados

## 🚀 Cómo Usar

1. Abre `index.html` en tu navegador (puedes hacer doble click o usar un servidor local)
2. Haz click en "Cargar Fotos" o arrastra fotos al área de drop
3. Selecciona una o más fotos que tengan datos GPS en sus metadatos
4. Las fotos aparecerán automáticamente en el mapa como marcadores
5. Haz click en cualquier marcador para ver las fotos de esa ubicación
6. Haz click en una foto en la galería para verla en tamaño completo
7. Usa "Ver Todas las Fotos" para centrar el mapa en todas las ubicaciones

## 📋 Requisitos

- Un navegador moderno (Chrome, Firefox, Safari, Edge)
- Fotos con datos GPS en sus metadatos EXIF (la mayoría de las fotos tomadas con smartphones tienen esta información)
- Conexión a internet (para cargar las librerías y obtener nombres de lugares)

## 💡 Notas

- Las fotos deben tener datos GPS en sus metadatos EXIF para aparecer en el mapa
- Si una foto no tiene datos GPS, se mostrará un mensaje en la consola del navegador
- Las fotos se agrupan automáticamente por ubicación (coordenadas similares)
- Todos los datos se procesan localmente en tu navegador - nada se sube a ningún servidor
- Los nombres de lugares se obtienen de OpenStreetMap mediante geocodificación inversa

## 🎨 Personalización

Puedes personalizar los colores y estilos editando las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #ffffff;
    --secondary-color: #00d4ff;
    --accent-color: #ff006e;
    /* ... más variables */
}
```

## 📱 Responsive

La aplicación está completamente optimizada para dispositivos móviles y tablets.

---

Hecho con ❤️ para Fran

