/**
 * ==========================================
 * CONFIGURATION & CONSTANTS
 * ==========================================
 * Centralized configuration for the application
 */

// ==========================================
// APP METADATA
// ==========================================
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Viajes Fran';

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
// Note: Actual Supabase credentials are in js/supabase-config.js
export const ENABLE_CLOUD_SYNC = true;
export const STORAGE_BUCKET = 'photos';

// ==========================================
// SCHEMA & DATA
// ==========================================
export const SCHEMA_VERSION = 1;

// ==========================================
// STORAGE KEYS
// ==========================================
export const STORAGE_KEYS = {
    AUTH: 'viajes-fran-auth',
    PHOTOS: 'viajes-fran-photos'
};

// ==========================================
// AUTH CONFIGURATION
// ==========================================
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ==========================================
// CACHING
// ==========================================
export const URL_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes

// ==========================================
// IMAGE PROCESSING
// ==========================================
export const IMAGE_COMPRESSION = {
    MAX_WIDTH: 800,
    QUALITY: 0.7,
    THUMBNAIL_MAX_WIDTH: 600,
    THUMBNAIL_QUALITY: 0.6,
    LOW_QUALITY_MAX_WIDTH: 400,
    LOW_QUALITY_QUALITY: 0.4
};

// ==========================================
// STORAGE LIMITS
// ==========================================
export const STORAGE_LIMITS = {
    MAX_SIZE_MB: 4,
    MAX_SIZE_BYTES: 4 * 1024 * 1024,
    FALLBACK_PHOTO_COUNT: 10
};

// ==========================================
// UI CONFIGURATION
// ==========================================
export const UI_CONFIG = {
    TOAST_DURATION_MS: 4000,
    CAROUSEL_MIN_ITEMS: 24,
    FLAGS_MIN_ITEMS: 30,
    CITY_SEARCH_DEBOUNCE_MS: 300,
    MAP_FIT_PADDING: [50, 50],
    MAP_MAX_ZOOM: 15,
    PHOTO_GALLERY_MAX_PREVIEW: 6
};

// ==========================================
// MAP CONFIGURATION
// ==========================================
export const MAP_CONFIG = {
    DEFAULT_CENTER: [0, 0],
    DEFAULT_ZOOM: 3,
    MIN_ZOOM: 2,
    MAX_ZOOM: 19,
    MARKER_SIZE: [30, 30],
    MARKER_ANCHOR: [15, 30],
    POPUP_ANCHOR: [0, -30],
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
};

// ==========================================
// GEOCODING
// ==========================================
export const GEOCODING_CONFIG = {
    API_URL: 'https://nominatim.openstreetmap.org',
    USER_AGENT: 'Viajes-Fran-App/1.0',
    SEARCH_LIMIT: 10,
    REVERSE_ZOOM: 10,
    REQUEST_DELAY_MS: 1000
};

// ==========================================
// DEFAULT VALUES
// ==========================================
export const DEFAULTS = {
    LOCATION: 'Madrid, España',
    COUNTRY: 'España',
    DATE: 'Fecha desconocida'
};

// ==========================================
// COUNTRY CODES MAPPING
// ==========================================
export const COUNTRY_TO_CODE = {
    'argentina': 'AR', 'república argentina': 'AR',
    'españa': 'ES', 'spain': 'ES',
    'francia': 'FR', 'france': 'FR',
    'italia': 'IT', 'italy': 'IT',
    'alemania': 'DE', 'germany': 'DE',
    'portugal': 'PT',
    'reino unido': 'GB', 'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'inglaterra': 'GB',
    'estados unidos': 'US', 'united states': 'US', 'usa': 'US', 'eeuu': 'US',
    'méxico': 'MX', 'mexico': 'MX',
    'brasil': 'BR', 'brazil': 'BR',
    'chile': 'CL', 'colombia': 'CO', 'perú': 'PE', 'peru': 'PE',
    'venezuela': 'VE', 'ecuador': 'EC', 'uruguay': 'UY', 'paraguay': 'PY',
    'bolivia': 'BO', 'cuba': 'CU', 'república dominicana': 'DO',
    'puerto rico': 'PR', 'costa rica': 'CR', 'panamá': 'PA', 'panama': 'PA',
    'guatemala': 'GT', 'honduras': 'HN', 'el salvador': 'SV', 'nicaragua': 'NI',
    'canadá': 'CA', 'canada': 'CA', 'japón': 'JP', 'japan': 'JP',
    'china': 'CN', 'corea del sur': 'KR', 'india': 'IN',
    'australia': 'AU', 'nueva zelanda': 'NZ', 'new zealand': 'NZ',
    'rusia': 'RU', 'russia': 'RU', 'países bajos': 'NL', 'netherlands': 'NL',
    'bélgica': 'BE', 'belgium': 'BE', 'suiza': 'CH', 'switzerland': 'CH',
    'austria': 'AT', 'grecia': 'GR', 'greece': 'GR', 'turquía': 'TR',
    'polonia': 'PL', 'suecia': 'SE', 'noruega': 'NO', 'dinamarca': 'DK',
    'finlandia': 'FI', 'irlanda': 'IE', 'ireland': 'IE', 'croacia': 'HR',
    'marruecos': 'MA', 'morocco': 'MA', 'egipto': 'EG', 'egypt': 'EG',
    'sudáfrica': 'ZA', 'israel': 'IL', 'tailandia': 'TH', 'singapur': 'SG'
};

// ==========================================
// MESSAGES
// ==========================================
export const MESSAGES = {
    ERRORS: {
        MAP_INIT: 'Error al inicializar el mapa',
        MAP_ALREADY_INIT: 'El mapa ya está inicializado',
        NO_MAP_CONTAINER: 'Contenedor del mapa no encontrado',
        LEAFLET_NOT_LOADED: 'Leaflet no se cargó correctamente',
        PHOTO_LOAD: 'Error cargando fotos guardadas',
        PHOTO_SAVE: 'Error guardando fotos',
        STORAGE_FULL: 'Espacio limitado: algunas fotos no se guardarán',
        BACKUP_EXPORT: 'Error al exportar backup',
        BACKUP_IMPORT: 'Error al importar backup. Verifica el archivo.',
        GEOCODING: 'Error obteniendo nombre de ubicación',
        CITY_SEARCH: 'Error al buscar. Intenta de nuevo.',
        NO_PHOTOS_MAP: 'No hay fotos en el mapa',
        CLOUD_SYNC: 'Cloud sync failed',
        CLOUD_UPDATE: 'Cloud update failed'
    },
    SUCCESS: {
        PHOTOS_LOADED: 'fotos cargadas exitosamente',
        PHOTOS_UPLOADED: 'cargadas exitosamente',
        PHOTO_DELETED: 'eliminada',
        PHOTOS_DELETED: 'eliminadas',
        ALL_PHOTOS_DELETED: 'Todas las fotos han sido eliminadas',
        NOTE_SAVED: 'Nota guardada exitosamente',
        NOTE_DELETED: 'Nota eliminada',
        BACKUP_EXPORTED: 'Backup exportado',
        BACKUP_IMPORTED: 'fotos importadas exitosamente',
        PHOTOS_PROCESSED: 'Fotos procesadas',
        CITY_SHOWING: 'ubicación'
    },
    INFO: {
        NO_SAVED_PHOTOS: 'No hay fotos guardadas en localStorage para este usuario',
        NO_PHOTOS_LOADED: 'No hay fotos cargadas',
        PHOTOS_WITHOUT_GPS: 'sin GPS - selecciona la ciudad',
        LOADING_PHOTOS: 'Cargando fotos con clave',
        SAVING_PHOTOS: 'Intentando guardar',
        LEGACY_PHOTOS_FOUND: 'Encontradas fotos antiguas (sin userId), limpiando...',
        IMPORTING_LEGACY: 'Importando formato legacy...'
    },
    CONFIRMATIONS: {
        DELETE_SELECTED: '¿Estás seguro de que quieres eliminar',
        DELETE_ALL: '¿Estás seguro de que quieres eliminar TODAS las fotos? Esta acción no se puede deshacer.',
        IMPORT_BACKUP: '¿Importar',
        IMPORT_LEGACY: 'Este archivo no tiene versión de esquema. ¿Quieres intentar importarlo de todos modos? (Formato legacy)',
        LOGOUT: '¿Estás seguro de que quieres cerrar sesión?'
    }
};

