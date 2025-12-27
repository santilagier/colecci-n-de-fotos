/**
 * ==========================================
 * VIAJES FRAN - MAIN APPLICATION
 * ==========================================
 * Photo travel map application with local storage persistence
 * and cloud synchronization via backend API.
 */

// ==========================================
// CONSTANTS
// ==========================================

/** Current schema version for data format migrations */
const SCHEMA_VERSION = 1;

/** Enable/disable cloud sync */
const ENABLE_CLOUD_SYNC = true;

/** Storage bucket name in Supabase */
const STORAGE_BUCKET = 'photos';

// Track which photos have been synced to DB
let syncedPhotoIds = new Set();

// Cache for signed URLs (expires after 50 minutes, URLs are valid for 1 hour)
const urlCache = new Map();
const URL_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes

/** Map of country names to ISO 3166-1 alpha-2 codes */
const COUNTRY_TO_CODE = {
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
// STATE MANAGEMENT
// ==========================================

/**
 * Get localStorage key for current user's photos
 * @returns {string} Storage key
 */
function getPhotosStorageKey() {
    const userId = getCurrentUserId();
    if (!userId) {
        console.warn('No user ID available, using default key');
        return 'viajes-fran-photos';
    }
    return `viajes-fran-photos:${userId}`;
}

let map = null;
let markers = [];
let photos = [];
let locationGroups = {};
let cityGroups = {};
let photosWithoutGPS = 0;
let initializationStarted = false;

// Upload state
let pendingFiles = [];
let photosWithoutGPSQueue = [];
let currentPhotoWithoutGPS = null;
let selectedCity = null;
let currentNotePhotoId = null;
let selectedPhotoIds = new Set();

/**
 * Clear all application state (called on logout or user change)
 */
function clearAppState() {
    // Clear map markers
    if (map) {
        markers.forEach(m => {
            if (m.marker) map.removeLayer(m.marker);
        });
    }
    markers = [];
    photos = [];
    locationGroups = {};
    cityGroups = {};
    photosWithoutGPS = 0;
    initializationStarted = false;
    
    // Clear UI
    const carouselTrack = document.getElementById('carousel-track');
    const flagsTrack = document.getElementById('flags-track');
    if (carouselTrack) carouselTrack.innerHTML = '';
    if (flagsTrack) flagsTrack.innerHTML = '';
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
}

// Make clearAppState available globally for auth.js
window.clearAppState = clearAppState;

// ==========================================
// APP INITIALIZATION
// ==========================================

/** Initialize the application (only called when user is authenticated) */
function initializeApp() {
    // Check authentication first
    if (!isAuthenticated()) {
        console.log('Usuario no autenticado, esperando login...');
        return;
    }
    
    // Reset initialization flag if user changed
    if (initializationStarted) {
        console.log('Reinicializando app para nuevo usuario...');
        clearAppState();
    }
    
    initializationStarted = true;
    console.log('Aplicación iniciando para usuario:', getCurrentUserId());
    
    // Function to actually initialize everything
    function doInitialize() {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.warn('Leaflet aún no está cargado, reintentando en 200ms...');
            setTimeout(doInitialize, 200);
            return;
        }
        
        // Initialize map if not already done
        if (!map) {
            try {
                initializeMap();
            } catch (error) {
                console.error('Error inicializando mapa:', error);
                setTimeout(doInitialize, 500);
                return;
            }
        }
        
        // Setup everything else
        setupEventListeners();
        setupCitySearch();
        setupPhotoNoteModal();
        setupLogoutListener(); // Setup logout button
        
        // Load photos for current user only (async)
        loadSavedPhotos().catch(err => {
            console.error('Error loading photos:', err);
        });
        
        // Update carousel after a delay to ensure DOM is ready
        setTimeout(() => {
            if (typeof updatePhotoCarousel === 'function') {
                updatePhotoCarousel();
            }
        }, 200);
    }
    
    // Start initialization (with retry if Leaflet not ready)
    doInitialize();
}

// Make initializeApp available globally for auth.js
window.initializeApp = initializeApp;

// Try to initialize when DOM is ready
// Don't auto-start app - wait for authentication
// App will be initialized by auth.js when user logs in

// Also try to initialize if scripts load after DOMContentLoaded
// But only if user is authenticated
window.addEventListener('load', function() {
    if (isAuthenticated() && !map && typeof L !== 'undefined') {
        console.log('Reintentando inicializar mapa después de que todos los recursos se carguen...');
        // Only initialize if app hasn't been initialized yet
        if (!initializationStarted && typeof initializeApp === 'function') {
            initializeApp();
        } else if (!map) {
            setTimeout(function() {
                if (!map) {
                    initializeMap();
                }
            }, 200);
        }
    }
});

// ==========================================
// MAP INITIALIZATION
// ==========================================

/** Initialize Leaflet map */
function initializeMap() {
    // Check if map is already initialized
    if (map) {
        console.log('El mapa ya está inicializado');
        return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
        console.log('Usuario no autenticado, no se inicializa el mapa');
        return;
    }

    // Check if map container exists and is visible
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Contenedor del mapa no encontrado');
        return;
    }

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet no se cargó correctamente. Verifica tu conexión a internet.');
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                        background: #f0f0f0; color: #666; text-align: center; padding: 20px; flex-direction: column; gap: 10px;">
                <h3 style="color: #e74c3c;">⚠️ Error al cargar el mapa</h3>
                <p>No se pudo cargar la librería de mapas. Por favor:</p>
                <ul style="text-align: left; max-width: 400px;">
                    <li>Verifica tu conexión a internet</li>
                    <li>Recarga la página (F5 o Cmd+R)</li>
                    <li>Abre la consola del navegador (F12) para ver más detalles</li>
                </ul>
            </div>
        `;
        return;
    }

    try {
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Elemento del mapa no encontrado');
            return;
        }
        
        // Check if map container is visible
        const containerStyle = window.getComputedStyle(mapElement);
        if (containerStyle.display === 'none') {
            console.warn('Contenedor del mapa está oculto, esperando...');
            setTimeout(initializeMap, 500);
            return;
        }
        
        console.log('Inicializando mapa Leaflet...');

        // Check if container already has a map instance
        if (mapElement._leaflet_id) {
            console.log('El contenedor del mapa ya tiene una instancia de Leaflet');
            return;
        }

        map = L.map('map', {
            center: [0, 0],
            zoom: 3,
            zoomControl: true,
            scrollWheelZoom: true,
            minZoom: 2,
            maxZoom: 19
        });

        // Move zoom controls to top-right to avoid conflict with action buttons
        map.zoomControl.setPosition('topright');

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add dark theme style to map
        map.whenReady(function() {
            const container = document.querySelector('.leaflet-container');
            if (container) {
                container.style.filter = 'brightness(0.8) contrast(1.1)';
            }
            // Mark map as initialized after a delay to allow initial markers to load
            setTimeout(() => {
                window.mapInitialized = true;
            }, 2000);
        });

        console.log('Mapa inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        document.getElementById('map').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                        background: #f0f0f0; color: #666; text-align: center; padding: 20px;">
                <div>
                    <h3 style="color: #e74c3c;">Error al inicializar el mapa</h3>
                    <p>${error.message}</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">Abre la consola del navegador (F12) para más detalles</p>
                </div>
            </div>
        `;
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

/** Setup all event listeners */
function setupEventListeners() {
    const photoInput = document.getElementById('photo-input');
    const clearBtn = document.getElementById('clear-btn');
    const modal = document.getElementById('photo-modal');
    const closeModal = document.querySelector('.close-modal');
    const dropZone = document.getElementById('drop-zone');

    photoInput.addEventListener('change', handlePhotoUpload);
    clearBtn.addEventListener('click', showRepositoryModal);
    
    const fitBoundsBtn = document.getElementById('fit-bounds-btn');
    fitBoundsBtn.addEventListener('click', showCountriesModal);
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsModal);
    }
    
    // Settings modal
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.querySelector('.close-settings');
    const exportBackupBtn = document.getElementById('export-backup-btn');
    const importBackupBtn = document.getElementById('import-backup-btn');
    const importBackupInput = document.getElementById('import-backup-input');
    
    if (closeSettings) {
        closeSettings.addEventListener('click', closeSettingsModal);
    }
    
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportBackup);
    }
    
    if (importBackupBtn) {
        importBackupBtn.addEventListener('click', importBackup);
    }
    
    if (importBackupInput) {
        importBackupInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processImportedBackup(e.target.files[0]);
                // Reset input so same file can be selected again
                e.target.value = '';
            }
        });
    }
    
    // Close settings modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            closeSettingsModal();
        }
    });
    
    // Countries modal
    const countriesModal = document.getElementById('countries-modal');
    const closeCountries = document.querySelector('.close-countries');
    
    if (closeCountries) {
        closeCountries.addEventListener('click', closeCountriesModal);
    }
    
    // Close countries modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === countriesModal) {
            closeCountriesModal();
        }
    });
    
    // Repository modal
    const repositoryModal = document.getElementById('repository-modal');
    const closeRepository = document.querySelector('.close-repository');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    
    // Upload confirmation modal
    const uploadConfirmModal = document.getElementById('upload-confirm-modal');
    const confirmUploadBtn = document.getElementById('confirm-upload-btn');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePhotoModal();
        }
        if (event.target === repositoryModal) {
            closeRepositoryModal();
        }
        if (event.target === uploadConfirmModal) {
            closeUploadConfirmationModal();
        }
    });

    closeModal.addEventListener('click', closePhotoModal);
    closeRepository.addEventListener('click', closeRepositoryModal);
    deleteAllBtn.addEventListener('click', confirmDeleteAll);
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedPhotos);
    }
    confirmUploadBtn.addEventListener('click', processPhotoUpload);
    cancelUploadBtn.addEventListener('click', closeUploadConfirmationModal);

    // Drag and Drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            // Create a fake event object to reuse handlePhotoUpload
            const fakeEvent = {
                target: {
                    files: files
                }
            };
            handlePhotoUpload(fakeEvent);
        }
    }

    // Also enable drag and drop on the entire document
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    document.addEventListener('dragleave', function(e) {
        if (!e.relatedTarget || !dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
}

// ==========================================
// PHOTO UPLOAD HANDLING
// ==========================================

function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Store files and show confirmation modal
    pendingFiles = files;
    showUploadConfirmationModal(files);
    // Reset input
    event.target.value = '';
}

// Show upload confirmation modal
function showUploadConfirmationModal(files) {
    const modal = document.getElementById('upload-confirm-modal');
    const uploadCount = document.getElementById('upload-count');
    const uploadPreview = document.getElementById('upload-preview');
    
    uploadCount.textContent = `${files.length} foto${files.length !== 1 ? 's' : ''} seleccionada${files.length !== 1 ? 's' : ''}`;
    
    // Clear and populate preview
    uploadPreview.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'upload-preview-item';
            previewItem.innerHTML = `<img src="${e.target.result}" alt="Preview ${index + 1}">`;
            uploadPreview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close upload confirmation modal
function closeUploadConfirmationModal() {
    const modal = document.getElementById('upload-confirm-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    pendingFiles = [];
}

// Process confirmed photo upload
function processPhotoUpload() {
    if (pendingFiles.length === 0) return;
    
    const files = [...pendingFiles];
    pendingFiles = [];
    closeUploadConfirmationModal();
    
    processFiles(files);
}

// Process files (extracted from handlePhotoUpload)
function processFiles(files) {
    if (files.length === 0) return;

    let processedCount = 0;
    const totalFiles = files.length;
    photosWithoutGPS = 0; // Reset counter

    files.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                // Read EXIF data
                EXIF.getData(img, function() {
                    const lat = EXIF.getTag(this, 'GPSLatitude');
                    const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
                    const lon = EXIF.getTag(this, 'GPSLongitude');
                    const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
                    const dateTime = EXIF.getTag(this, 'DateTime') || EXIF.getTag(this, 'DateTimeOriginal');
                    
                    if (lat && lon) {
                        // Convert GPS coordinates to decimal
                        const latitude = convertDMSToDD(lat, latRef);
                        const longitude = convertDMSToDD(lon, lonRef);
                        
                        // Create photo object
                        const photo = {
                            id: Date.now() + index,
                            file: file,
                            url: e.target.result,
                            lat: latitude,
                            lon: longitude,
                            date: dateTime || 'Fecha desconocida',
                            location: "Madrid, España", // Default location, will be updated later
                            country: "España", // Default country, will be updated later
                            noteTitle: '',
                            noteDescription: ''
                        };
                        
                        photos.push(photo);
                        addPhotoToMap(photo);
                        
                        // Sync to cloud database (async, non-blocking)
                        syncPhotoToCloud(photo).catch(err => {
                            console.warn('Cloud sync failed:', err);
                        });
                        
                        // Try to get real location name (async, will update later)
                        getLocationName(photo.lat, photo.lon, photo.id);
                        
                        updatePhotoCarousel();
                    } else {
                        // Photo without GPS data - add to queue for manual city selection
                        const photoWithoutGPS = {
                            id: Date.now() + index,
                            file: file,
                            url: e.target.result,
                            date: dateTime || 'Fecha desconocida',
                            needsCity: true
                        };
                        photosWithoutGPSQueue.push(photoWithoutGPS);
                        photosWithoutGPS++;
                    }
                    
                    processedCount++;
                    if (processedCount === totalFiles) {
                        // Force save to localStorage after all photos are processed
                        savePhotosToLocalStorage().then(() => {
                            console.log('Guardado completado después de procesar todas las fotos');
                        });
                        updateStats();
                        
                        // Check if there are photos without GPS that need city selection
                        if (photosWithoutGPSQueue.length > 0) {
                            showToast(`${photosWithoutGPSQueue.length} foto${photosWithoutGPSQueue.length > 1 ? 's' : ''} sin GPS - selecciona la ciudad`, 'info');
                            // Start the city selection process
                            setTimeout(() => {
                                showNextCitySelectionModal();
                            }, 500);
                        } else if (photos.length > 0) {
                            showToast(`${photos.length} foto${photos.length > 1 ? 's cargadas' : ' cargada'} exitosamente`, 'success');
                        }
                        photosWithoutGPS = 0;
                    }
                });
            };
        };
        
        reader.readAsDataURL(file);
    });
}

// ==========================================
// COORDINATE UTILITIES
// ==========================================

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {Array} dms - Array of [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal degrees
 */
function convertDMSToDD(dms, ref) {
    let dd = dms[0] + dms[1] / 60 + dms[2] / (60 * 60);
    if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
    }
    return dd;
}

// ==========================================
// MAP MARKERS & GROUPING
// ==========================================

/** Add photo to map and location groups */
function addPhotoToMap(photo) {
    const locationKey = `${photo.lat.toFixed(4)}_${photo.lon.toFixed(4)}`;
    
    // Group photos by location (for backward compatibility)
    if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = {
            lat: photo.lat,
            lon: photo.lon,
            photos: [],
            name: photo.location || null,
            country: photo.country || null,
            city: null
        };
    }
    
    locationGroups[locationKey].photos.push(photo);
    
    // Always group by city immediately - use default if no location yet
    if (!photo.location) {
        // Assign default city "Madrid" temporarily
        photo.location = "Madrid, España";
        photo.country = photo.country || "España";
    }
    
    // Group by city (will use Madrid if location is not set yet)
    groupByCity(photo);
}

// Create temporary marker for photos without city info
function createTemporaryMarker(photo, locationKey) {
    // Check if temporary marker already exists for this location
    const existingMarker = markers.find(m => m.locationKey === locationKey);
    if (existingMarker) {
        // Update existing temporary marker
        const photoCount = locationGroups[locationKey].photos.length;
        const iconHtml = `
            <div class="custom-marker" style="position: relative;">
                <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
                            background: var(--accent-color); color: white; padding: 2px 6px; 
                            border-radius: 10px; font-size: 10px; font-weight: 600; white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    ${photoCount}
                </div>
            </div>
        `;
        
        const customIcon = L.divIcon({
            className: 'custom-marker-container',
            html: iconHtml,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        existingMarker.marker.setIcon(customIcon);
        return;
    }
    
    // Create new temporary marker
    const photoCount = locationGroups[locationKey].photos.length;
    const iconHtml = `
        <div class="custom-marker" style="position: relative;">
            <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
                        background: var(--accent-color); color: white; padding: 2px 6px; 
                        border-radius: 10px; font-size: 10px; font-weight: 600; white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${photoCount}
            </div>
        </div>
    `;
    
    const customIcon = L.divIcon({
        className: 'custom-marker-container',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
    
    const marker = L.marker([photo.lat, photo.lon], { icon: customIcon })
        .addTo(map)
        .on('click', function() {
            showPhotoGallery(locationKey);
        });
    
    markers.push({
        marker: marker,
        locationKey: locationKey,
        cityName: null, // Temporary marker, no city yet
        isTemporary: true
    });
}

// Group photos by city
function groupByCity(photo) {
    if (!photo.location) {
        // If still no location, use Madrid as default
        photo.location = "Madrid, España";
        photo.country = photo.country || "España";
    }
    
    // Extract city name from location string
    // Format is usually: "City, Country" or "City, State, Country"
    const parts = photo.location.split(',');
    let cityName = null;
    
    if (parts.length >= 2) {
        // Take the first part as city (usually the city name)
        cityName = parts[0].trim();
    } else if (parts.length === 1) {
        // If only one part, it might be just the country
        cityName = parts[0].trim();
    }
    
    // If we couldn't extract a city, use Madrid as default
    if (!cityName || cityName.length === 0) {
        cityName = "Madrid";
    }
    
    // Create or update city group
    if (!cityGroups[cityName]) {
        cityGroups[cityName] = {
            city: cityName,
            photos: [],
            locations: [],
            country: photo.country || null
        };
    }
    
    // Remove photo from old city group if it exists
    Object.keys(cityGroups).forEach(city => {
        if (city !== cityName) {
            cityGroups[city].photos = cityGroups[city].photos.filter(p => p.id !== photo.id);
            // Remove location if no photos left
            if (cityGroups[city].photos.length === 0) {
                cityGroups[city].locations = [];
            }
        }
    });
    
    // Add photo if not already in the group
    if (!cityGroups[cityName].photos.find(p => p.id === photo.id)) {
        cityGroups[cityName].photos.push(photo);
        
        // Add location if not already present
        const locationKey = `${photo.lat.toFixed(4)}_${photo.lon.toFixed(4)}`;
        if (!cityGroups[cityName].locations.find(l => l.key === locationKey)) {
            cityGroups[cityName].locations.push({
                key: locationKey,
                lat: photo.lat,
                lon: photo.lon
            });
        }
    }
    
    // Update markers on map (debounced to avoid too many updates)
    clearTimeout(window.cityMarkersUpdateTimeout);
    window.cityMarkersUpdateTimeout = setTimeout(() => {
        updateCityMarkers();
    }, 300);
}

// Update markers on map based on city groups
function updateCityMarkers() {
    if (!map) return;
    
    // Remove markers for cities that no longer exist or have no photos
    markers = markers.filter(m => {
        const cityGroup = cityGroups[m.cityName];
        if (!cityGroup || cityGroup.photos.length === 0) {
            if (m.marker && map.hasLayer(m.marker)) {
                map.removeLayer(m.marker);
            }
            return false;
        }
        return true;
    });
    
    // Add or update markers for each city
    Object.keys(cityGroups).forEach(cityName => {
        const cityGroup = cityGroups[cityName];
        if (cityGroup.photos.length === 0) return;
        
        // Check if marker already exists for this city
        const existingMarker = markers.find(m => m.cityName === cityName);
        
        if (existingMarker) {
            // Update existing marker icon with new photo count
            const photoCount = cityGroup.photos.length;
            const iconHtml = `
                <div class="custom-marker" style="position: relative;">
                    <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
                                background: var(--accent-color); color: white; padding: 2px 6px; 
                                border-radius: 10px; font-size: 10px; font-weight: 600; white-space: nowrap;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${photoCount}
                    </div>
                </div>
            `;
            
            const customIcon = L.divIcon({
                className: 'custom-marker-container',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });
            
            existingMarker.marker.setIcon(customIcon);
        } else {
            // Create new marker
            // Calculate center point of all locations in this city
            let avgLat = 0;
            let avgLon = 0;
            cityGroup.locations.forEach(loc => {
                avgLat += loc.lat;
                avgLon += loc.lon;
            });
            avgLat /= cityGroup.locations.length;
            avgLon /= cityGroup.locations.length;
            
            // Create custom icon with photo count
            const photoCount = cityGroup.photos.length;
            const iconHtml = `
                <div class="custom-marker" style="position: relative;">
                    <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); 
                                background: var(--accent-color); color: white; padding: 2px 6px; 
                                border-radius: 10px; font-size: 10px; font-weight: 600; white-space: nowrap;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${photoCount}
                    </div>
                </div>
            `;
            
            const customIcon = L.divIcon({
                className: 'custom-marker-container',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
            });
            
            // Create marker at center point
            const marker = L.marker([avgLat, avgLon], { icon: customIcon })
                .addTo(map)
                .on('click', function() {
                    showCityPhotoGallery(cityName);
                });
            
            markers.push({
                marker: marker,
                cityName: cityName
            });
        }
    });
    
    // Fit map to show all markers (only if we have markers)
    // Don't auto-fit on initial load, let user control zoom
    if (markers.length > 0 && window.mapInitialized) {
        const bounds = markers.map(m => [m.marker.getLatLng().lat, m.marker.getLatLng().lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// ==========================================
// PHOTO GALLERIES
// ==========================================

/** Show photo gallery for a city */
async function showCityPhotoGallery(cityName) {
    const cityGroup = cityGroups[cityName];
    if (!cityGroup || !cityGroup.photos.length) return;
    
    const modal = document.getElementById('photo-modal');
    const modalLocation = document.getElementById('modal-location');
    const modalDate = document.getElementById('modal-date');
    const photoGallery = document.getElementById('photo-gallery');
    
    // Get location name
    const locationName = cityGroup.city;
    if (cityGroup.country) {
        modalLocation.textContent = `📍 ${locationName}, ${cityGroup.country}`;
    } else {
        modalLocation.textContent = `📍 ${locationName}`;
    }
    
    // Get date range
    const dates = cityGroup.photos.map(p => p.date).filter(d => d && d !== 'Fecha desconocida');
    if (dates.length > 0) {
        const sortedDates = dates.sort();
        const dateStr = sortedDates.length > 1 
            ? `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
            : sortedDates[0];
        modalDate.textContent = `${cityGroup.photos.length} foto${cityGroup.photos.length > 1 ? 's' : ''} • ${dateStr}`;
    } else {
        modalDate.textContent = `${cityGroup.photos.length} foto${cityGroup.photos.length > 1 ? 's' : ''}`;
    }
    
    // Clear and populate gallery
    photoGallery.innerHTML = '';
    
    // Process photos asynchronously
    for (const photo of cityGroup.photos) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Get photo URL (prefer cloud URL, fallback to local)
        const photoUrl = await getPhotoUrl(photo, false) || photo.url;
        
        // Create photo content
        let photoHTML = '';
        
        if (photoUrl) {
            photoHTML = `<img src="${photoUrl}" alt="Foto" loading="lazy">`;
        } else {
            // Photo without image (from other device)
            photoHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                            background: var(--bg-secondary); color: var(--text-secondary); 
                            flex-direction: column; gap: 10px; padding: 20px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <div style="text-align: center; font-size: 0.85rem;">
                        <div>Imagen no disponible</div>
                        <div style="opacity: 0.7; margin-top: 4px;">Cargada desde otro dispositivo</div>
                    </div>
                </div>
            `;
        }
        
        photoHTML += `
            <div class="photo-item-actions">
                <button class="edit-note-btn" data-photo-id="${photo.id}">
                    📝 Nota
                </button>
            </div>
        `;
        
        // Add note display if exists
        if (photo.noteTitle || photo.noteDescription) {
            photoHTML += `
                <div class="photo-note-display">
                    ${photo.noteTitle ? `<div class="photo-note-title">${photo.noteTitle}</div>` : ''}
                    ${photo.noteDescription ? `<div class="photo-note-description">${photo.noteDescription}</div>` : ''}
                </div>
            `;
        }
        
        photoItem.innerHTML = photoHTML;
        
        // Click on image opens full size (only if has image)
        const imgElement = photoItem.querySelector('img');
        if (imgElement) {
            imgElement.addEventListener('click', async () => {
                const fullUrl = await getPhotoUrl(photo, false) || photo.url;
                if (fullUrl) {
                    window.open(fullUrl, '_blank');
                }
            });
        }
        
        // Click on edit note button
        const editBtn = photoItem.querySelector('.edit-note-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openPhotoNoteModal(photo.id);
            });
        }
        
        photoGallery.appendChild(photoItem);
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ==========================================
// GEOCODING
// ==========================================

/**
 * Get location name using reverse geocoding (Nominatim)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} photoId - Photo ID to update
 */
async function getLocationName(lat, lon, photoId) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'Viajes-Fran-App/1.0',
                    'Accept-Language': 'es,en'
                }
            }
        );
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            let locationName = '';
            
            // Try to get a meaningful location name
            if (address.city || address.town || address.village) {
                locationName = address.city || address.town || address.village;
                if (address.country) {
                    locationName += `, ${address.country}`;
                }
            } else if (address.state || address.region) {
                locationName = address.state || address.region;
                if (address.country) {
                    locationName += `, ${address.country}`;
                }
            } else if (address.country) {
                locationName = address.country;
            } else {
                locationName = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
            }
            
            // Update photo location and country
            const photo = photos.find(p => p.id === photoId);
            if (photo) {
                // Only update if we got real location info (not Madrid default)
                if (locationName && locationName !== "Madrid, España") {
                    photo.location = locationName;
                    
                    // Priority: try to use the country code from Nominatim if available
                    if (address.country_code) {
                        photo.countryCode = address.country_code.toUpperCase();
                    }
                    
                    if (address.country) {
                        photo.country = address.country;
                    }
                    
                    // Re-group by city with real location
                    groupByCity(photo);
                    
                    // Update in cloud database (async, non-blocking)
                    updatePhotoInCloud(photo).catch(err => {
                        console.warn('Cloud update failed:', err);
                    });
                    
                    // Save with updated location (async)
                    savePhotosToLocalStorage();
                }
            }
            
            // Update location group
            const locationKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
            if (locationGroups[locationKey]) {
                if (locationName && locationName !== "Madrid, España") {
                    locationGroups[locationKey].name = locationName;
                    if (address.country) {
                        locationGroups[locationKey].country = address.country;
                    }
                    if (address.city || address.town || address.village) {
                        locationGroups[locationKey].city = address.city || address.town || address.village;
                    }
                }
            }
            
            // Update stats after getting location
            updateStats();
        }
    } catch (error) {
        console.log('Error obteniendo nombre de ubicación:', error);
    }
}

// Show photo gallery modal
function showPhotoGallery(locationKey) {
    const location = locationGroups[locationKey];
    if (!location || !location.photos.length) return;
    
    const modal = document.getElementById('photo-modal');
    const modalLocation = document.getElementById('modal-location');
    const modalDate = document.getElementById('modal-date');
    const photoGallery = document.getElementById('photo-gallery');
    
    // Get location name
    const locationName = location.name || `${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`;
    modalLocation.textContent = `📍 ${locationName}`;
    
    // Get date range
    const dates = location.photos.map(p => p.date).filter(d => d && d !== 'Fecha desconocida');
    if (dates.length > 0) {
        const sortedDates = dates.sort();
        const dateStr = sortedDates.length > 1 
            ? `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
            : sortedDates[0];
        modalDate.textContent = `${location.photos.length} foto${location.photos.length > 1 ? 's' : ''} • ${dateStr}`;
    } else {
        modalDate.textContent = `${location.photos.length} foto${location.photos.length > 1 ? 's' : ''}`;
    }
    
    // Clear and populate gallery
    photoGallery.innerHTML = '';
    location.photos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `<img src="${photo.url}" alt="Foto">`;
        photoItem.addEventListener('click', () => {
            // Open full size image
            window.open(photo.url, '_blank');
        });
        photoGallery.appendChild(photoItem);
    });
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/** Close photo modal */
function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ==========================================
// REPOSITORY MODAL
// ==========================================

async function showRepositoryModal() {
    const repositoryModal = document.getElementById('repository-modal');
    const repositoryGallery = document.getElementById('repository-gallery');
    const repositoryCount = document.getElementById('repository-count');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const deleteSelectedText = document.getElementById('delete-selected-text');
    
    repositoryCount.textContent = `${photos.length} foto${photos.length !== 1 ? 's' : ''}`;
    
    // Reset selection
    selectedPhotoIds.clear();
    updateDeleteSelectedButton();
    
    repositoryGallery.innerHTML = '';
    
    if (photos.length === 0) {
        repositoryGallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">No hay fotos cargadas</p>
                <p>Carga fotos usando el botón "Cargar Fotos" o arrástralas al área de drop</p>
            </div>
        `;
    } else {
        // Process photos sequentially to use await
        for (let index = 0; index < photos.length; index++) {
            const photo = photos[index];
            const repositoryItem = document.createElement('div');
            repositoryItem.className = 'repository-item';
            repositoryItem.dataset.photoId = photo.id;
            
            const locationText = photo.location || `${photo.lat.toFixed(4)}°, ${photo.lon.toFixed(4)}°`;
            const dateText = photo.date !== 'Fecha desconocida' ? photo.date : '';
            
            // Create checkbox
            const checkbox = document.createElement('div');
            checkbox.className = 'repository-item-checkbox';
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePhotoSelection(photo.id, repositoryItem, checkbox);
            });
            
            // Build note display
            let noteHTML = '';
            if (photo.noteTitle || photo.noteDescription) {
                noteHTML = `
                    <div class="photo-note-display" style="position: absolute; bottom: 0; left: 0; right: 0; margin: 0; border-radius: 0 0 12px 12px;">
                        ${photo.noteTitle ? `<div class="photo-note-title" style="font-size: 0.85rem;">${photo.noteTitle}</div>` : ''}
                        ${photo.noteDescription ? `<div class="photo-note-description" style="font-size: 0.75rem; max-height: 3em; overflow: hidden;">${photo.noteDescription}</div>` : ''}
                    </div>
                `;
            }
            
            // Get photo URL (prefer thumbnail, fallback to full, then local)
            const repoPhotoUrl = await getPhotoUrl(photo, true) || await getPhotoUrl(photo, false) || photo.url;
            
            repositoryItem.innerHTML = `
                ${repoPhotoUrl ? `<img src="${repoPhotoUrl}" alt="Foto ${index + 1}" loading="lazy">` : `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                background: var(--bg-secondary); color: var(--text-secondary);">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                `}
                <button class="edit-note-btn" data-photo-id="${photo.id}" style="position: absolute; top: 10px; right: 10px; z-index: 15; opacity: 1; font-size: 0.75rem; padding: 6px 10px;">
                    📝
                </button>
                ${noteHTML}
                <div class="repository-item-info">
                    <div>${locationText}</div>
                    ${dateText ? `<div style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px;">${dateText}</div>` : ''}
                </div>
            `;
            
            repositoryItem.appendChild(checkbox);
            
            // Click on image opens gallery (not checkbox)
            repositoryItem.querySelector('img').addEventListener('click', (e) => {
                if (e.target.closest('.repository-item-checkbox')) return;
                if (e.target.closest('.edit-note-btn')) return;
                
                // Find which city this photo belongs to and show gallery
                const cityName = findCityForPhoto(photo);
                if (cityName) {
                    closeRepositoryModal();
                    setTimeout(() => {
                        showCityPhotoGallery(cityName);
                    }, 300);
                } else {
                    // Open full size image
                    window.open(photo.url, '_blank');
                }
            });
            
            // Add event listener for edit note button
            const editNoteBtn = repositoryItem.querySelector('.edit-note-btn');
            if (editNoteBtn) {
                editNoteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPhotoNoteModal(photo.id);
                });
            }
            
            repositoryGallery.appendChild(repositoryItem);
        }
    }
    
    repositoryModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Toggle photo selection
function togglePhotoSelection(photoId, itemElement, checkboxElement) {
    if (selectedPhotoIds.has(photoId)) {
        selectedPhotoIds.delete(photoId);
        itemElement.classList.remove('selected');
        checkboxElement.classList.remove('checked');
    } else {
        selectedPhotoIds.add(photoId);
        itemElement.classList.add('selected');
        checkboxElement.classList.add('checked');
    }
    updateDeleteSelectedButton();
}

// Update delete selected button
function updateDeleteSelectedButton() {
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const deleteSelectedText = document.getElementById('delete-selected-text');
    
    const count = selectedPhotoIds.size;
    if (deleteSelectedText) {
        deleteSelectedText.textContent = `Eliminar Seleccionadas (${count})`;
    }
    if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = count === 0;
    }
}

// Delete selected photos
async function deleteSelectedPhotos() {
    if (selectedPhotoIds.size === 0) return;
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedPhotoIds.size} foto${selectedPhotoIds.size > 1 ? 's' : ''} seleccionada${selectedPhotoIds.size > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Delete from cloud database and storage first
    const photosToDelete = photos.filter(photo => selectedPhotoIds.has(photo.id));
    for (const photo of photosToDelete) {
        if (photo.dbId) {
            await deletePhotoFromCloud(photo.dbId, photo.storagePath, photo.thumbPath);
        }
    }
    
    // Remove photos from array
    photos = photos.filter(photo => !selectedPhotoIds.has(photo.id));
    
    // Remove from location groups
    Object.keys(locationGroups).forEach(locationKey => {
        locationGroups[locationKey].photos = locationGroups[locationKey].photos.filter(
            photo => !selectedPhotoIds.has(photo.id)
        );
        if (locationGroups[locationKey].photos.length === 0) {
            delete locationGroups[locationKey];
        }
    });
    
    // Remove from city groups
    Object.keys(cityGroups).forEach(cityName => {
        cityGroups[cityName].photos = cityGroups[cityName].photos.filter(
            photo => !selectedPhotoIds.has(photo.id)
        );
        if (cityGroups[cityName].photos.length === 0) {
            delete cityGroups[cityName];
        }
    });
    
    // Remove markers from map
    markers = markers.filter(m => {
        if (m.cityName) {
            const cityGroup = cityGroups[m.cityName];
            if (!cityGroup || cityGroup.photos.length === 0) {
                if (m.marker && map.hasLayer(m.marker)) {
                    map.removeLayer(m.marker);
                }
                return false;
            }
        }
        return true;
    });
    
    // Update map markers
    updateCityMarkers();
    
    // Save to localStorage
    savePhotosToLocalStorage();
    
    // Update stats and carousel
    updateStats();
    updatePhotoCarousel();
    
    // Refresh repository modal
    showRepositoryModal();
    
    showToast(`${selectedPhotoIds.size} foto${selectedPhotoIds.size > 1 ? 's eliminadas' : ' eliminada'} exitosamente`, 'success');
}

/** Close repository modal */
function closeRepositoryModal() {
    const repositoryModal = document.getElementById('repository-modal');
    repositoryModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

/** Confirm and delete all photos */
function confirmDeleteAll() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las fotos? Esta acción no se puede deshacer.')) {
        clearAllPhotos();
        closeRepositoryModal();
    }
}

/** Clear all photos from the application */
async function clearAllPhotos() {
    // Delete all from cloud database and storage
    if (ENABLE_CLOUD_SYNC && isAuthenticated()) {
        const supabase = window.supabaseClient;
        if (supabase) {
            try {
                const userId = getCurrentUserId();
                
                // First get all storage paths
                const { data: photosToDelete } = await supabase
                    .from('photos')
                    .select('storage_path, thumb_path');

                // Delete files from storage
                if (photosToDelete && photosToDelete.length > 0) {
                    const filesToDelete = [];
                    photosToDelete.forEach(photo => {
                        if (photo.storage_path) filesToDelete.push(photo.storage_path);
                        if (photo.thumb_path) filesToDelete.push(photo.thumb_path);
                    });

                    if (filesToDelete.length > 0) {
                        await supabase.storage
                            .from(STORAGE_BUCKET)
                            .remove(filesToDelete);
                    }
                }

                // Delete all records from database
                const { error } = await supabase
                    .from('photos')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround)

                if (error) {
                    console.warn('Database delete error:', error.message);
                } else {
                    console.log('✅ All photos deleted from cloud');
                }
            } catch (error) {
                console.warn('⚠️ Failed to delete from cloud:', error);
            }
        }
    }
    
    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];
    photos = [];
    locationGroups = {};
    cityGroups = {};
    syncedPhotoIds.clear();
    updateStats();
    localStorage.removeItem(getPhotosStorageKey());
    map.setView([0, 0], 3);
    showToast('Todas las fotos han sido eliminadas', 'success');
}

// ==========================================
// CLOUD SYNC (API)
// ==========================================

/**
 * Upload photo file to cloud storage and sync to database
 * @param {Object} photo - Photo object with file property
 * @returns {Promise<void>}
 */
async function syncPhotoToCloud(photo) {
    if (!ENABLE_CLOUD_SYNC || !isAuthenticated()) {
        return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        console.warn('Supabase not available');
        return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
        console.warn('No user ID, skipping cloud sync');
        return;
    }

    // Skip if already synced
    if (syncedPhotoIds.has(photo.id)) {
        return;
    }

    try {
        let storagePath = null;
        let thumbPath = null;

        // Upload file to Supabase Storage if available
        if (photo.file || (photo.url && photo.url.startsWith('data:'))) {
            let fileToUpload;
            let fileName;

            if (photo.file) {
                fileToUpload = photo.file;
                fileName = `${Date.now()}-${photo.file.name || 'photo.jpg'}`;
            } else {
                // Convert dataURL to Blob
                const response = await fetch(photo.url);
                fileToUpload = await response.blob();
                fileName = `${Date.now()}-photo.jpg`;
            }

            // Upload to user's folder in storage
            storagePath = `${userId}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, fileToUpload, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.warn('Storage upload error:', uploadError.message);
                // Continue without storage - still save metadata
                storagePath = null;
            }

            // Create thumbnail (smaller version)
            if (storagePath && photo.url) {
                try {
                    const thumbBlob = await createThumbnail(photo.url);
                    thumbPath = `${userId}/thumbs/${fileName}`;
                    
                    await supabase.storage
                        .from(STORAGE_BUCKET)
                        .upload(thumbPath, thumbBlob, {
                            cacheControl: '3600',
                            upsert: false
                        });
                } catch (thumbError) {
                    console.warn('Thumbnail creation failed:', thumbError);
                    thumbPath = null;
                }
            }
        }

        // Insert metadata into database
        const { data, error } = await supabase
            .from('photos')
            .insert({
                user_id: userId,
                location: photo.location || null,
                lat: photo.lat || null,
                lon: photo.lon || null,
                date: photo.date || 'Fecha desconocida',
                note_title: photo.noteTitle || '',
                note_description: photo.noteDescription || '',
                country: photo.country || null,
                country_code: photo.countryCode || null,
                storage_path: storagePath,
                thumb_path: thumbPath
            })
            .select()
            .single();

        if (error) {
            console.warn('Database insert error:', error.message);
            return;
        }

        // Store the DB ID and storage info in the photo object
        photo.dbId = data.id;
        photo.storagePath = storagePath;
        photo.thumbPath = thumbPath;
        photo.hasImage = !!storagePath;

        syncedPhotoIds.add(photo.id);
        console.log(`✅ Photo uploaded to cloud: ${photo.id}`);

    } catch (error) {
        console.warn('⚠️ Cloud upload error:', error.message);
        // Don't throw - allow app to work offline
    }
}

/**
 * Create a thumbnail from a data URL
 * @param {string} dataUrl - Original image data URL
 * @returns {Promise<Blob>} Thumbnail blob
 */
function createThumbnail(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

/**
 * Get signed URL for a photo (with caching)
 * @param {Object} photo - Photo object
 * @param {boolean} useThumb - Use thumbnail URL
 * @returns {Promise<string|null>} Signed URL or null
 */
async function getPhotoUrl(photo, useThumb = false) {
    // Check cache first
    const cacheKey = `${photo.id}_${useThumb ? 'thumb' : 'full'}`;
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < URL_CACHE_DURATION) {
        return cached.url;
    }
    
    // If photo has URL from cloud response, use it
    if (useThumb && photo.thumbUrl) {
        cacheUrl(photo.id, photo.thumbUrl, true);
        return photo.thumbUrl;
    }
    if (!useThumb && photo.imageUrl) {
        cacheUrl(photo.id, photo.imageUrl, false);
        return photo.imageUrl;
    }
    
    // If photo has storage path, get signed URL from Supabase
    const storagePath = useThumb ? photo.thumbPath : photo.storagePath;
    if (storagePath) {
        try {
            const supabase = window.supabaseClient;
            if (!supabase) {
                return photo.url || null;
            }

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(storagePath, 3600); // 1 hour expiry

            if (error) {
                console.warn('Error getting signed URL:', error.message);
                return photo.url || null;
            }

            cacheUrl(photo.id, data.signedUrl, useThumb);
            return data.signedUrl;
        } catch (error) {
            console.warn('Error fetching signed URL:', error);
        }
    }
    
    // Fallback to local URL if available
    return photo.url || null;
}

/**
 * Cache a URL for a photo
 * @param {number} photoId - Photo ID
 * @param {string} url - URL to cache
 * @param {boolean} isThumb - Whether this is a thumbnail URL
 */
function cacheUrl(photoId, url, isThumb) {
    const cacheKey = `${photoId}_${isThumb ? 'thumb' : 'full'}`;
    urlCache.set(cacheKey, {
        url: url,
        timestamp: Date.now()
    });
}

/**
 * Update photo in cloud database
 * @param {Object} photo - Photo object
 * @returns {Promise<void>}
 */
async function updatePhotoInCloud(photo) {
    if (!ENABLE_CLOUD_SYNC || !isAuthenticated() || !photo.dbId) {
        return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        return;
    }

    try {
        const { error } = await supabase
            .from('photos')
            .update({
                location: photo.location || null,
                lat: photo.lat || null,
                lon: photo.lon || null,
                date: photo.date || 'Fecha desconocida',
                note_title: photo.noteTitle || '',
                note_description: photo.noteDescription || '',
                country: photo.country || null,
                country_code: photo.countryCode || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', photo.dbId);

        if (error) {
            console.warn(`⚠️ Failed to update photo ${photo.id}:`, error.message);
        } else {
            console.log(`✅ Photo updated in cloud: ${photo.id}`);
        }
    } catch (error) {
        console.warn('⚠️ Cloud update error:', error.message);
    }
}

/**
 * Delete photo from cloud database and storage
 * @param {string} dbId - Database ID
 * @param {string} storagePath - Storage path (optional)
 * @param {string} thumbPath - Thumbnail path (optional)
 * @returns {Promise<void>}
 */
async function deletePhotoFromCloud(dbId, storagePath = null, thumbPath = null) {
    if (!ENABLE_CLOUD_SYNC || !isAuthenticated() || !dbId) {
        return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        return;
    }

    try {
        // Delete files from storage if paths provided
        if (storagePath || thumbPath) {
            const filesToDelete = [];
            if (storagePath) filesToDelete.push(storagePath);
            if (thumbPath) filesToDelete.push(thumbPath);

            const { error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove(filesToDelete);

            if (storageError) {
                console.warn('Storage delete error:', storageError.message);
            }
        }

        // Delete from database
        const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', dbId);

        if (error) {
            console.warn(`⚠️ Failed to delete photo ${dbId}:`, error.message);
        } else {
            console.log(`✅ Photo deleted from cloud: ${dbId}`);
        }
    } catch (error) {
        console.warn('⚠️ Cloud delete error:', error.message);
    }
}

/**
 * Load photos from cloud database
 * @returns {Promise<Array>} Array of photo records from DB
 */
async function loadPhotosFromCloud() {
    if (!ENABLE_CLOUD_SYNC || !isAuthenticated()) {
        return [];
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('⚠️ Failed to load photos from cloud:', error.message);
            return [];
        }

        // Transform DB fields to app format
        const photos = (data || []).map(row => ({
            id: row.id,
            dbId: row.id,
            location: row.location,
            lat: row.lat,
            lon: row.lon,
            date: row.date,
            noteTitle: row.note_title || '',
            noteDescription: row.note_description || '',
            country: row.country,
            countryCode: row.country_code,
            storagePath: row.storage_path,
            thumbPath: row.thumb_path,
            hasImage: !!row.storage_path,
            url: null // Will be fetched on demand
        }));

        console.log(`📥 Loaded ${photos.length} photos from cloud`);
        return photos;
    } catch (error) {
        console.warn('⚠️ Cloud load error:', error.message);
        return [];
    }
}

// ==========================================
// LOCAL STORAGE
// ==========================================

/**
 * Compress image to reduce size for localStorage
 * @param {string} dataUrl - Base64 data URL
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Compressed data URL
 */
function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Scale down if larger than maxWidth
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG
            const compressedUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedUrl);
        };
        img.onerror = function() {
            // If compression fails, return original
            resolve(dataUrl);
        };
        img.src = dataUrl;
    });
}

/** Save photos to localStorage with compression */
async function savePhotosToLocalStorage() {
    try {
        if (!photos || photos.length === 0) {
            console.log('No hay fotos para guardar');
            return;
        }
        
        console.log(`💾 Intentando guardar ${photos.length} fotos...`);
        
        // Compress images before saving (only photos with images)
        const photosToSave = [];
        for (const photo of photos) {
            // Skip photos without images (from other devices)
            if (!photo || photo.hasImage === false || photo.lat === undefined || photo.lon === undefined) {
                continue;
            }
            
            // Must have URL to save
            if (!photo.url) {
                continue;
            }
            
            // Compress the image
            let compressedUrl = photo.url;
            if (photo.url.startsWith('data:')) {
                try {
                    compressedUrl = await compressImage(photo.url, 600, 0.6);
                } catch (e) {
                    console.warn('Error comprimiendo imagen, usando original');
                }
            }
            
            photosToSave.push({
                id: photo.id || Date.now() + Math.random(),
                url: compressedUrl,
                lat: photo.lat,
                lon: photo.lon,
                date: photo.date || 'Fecha desconocida',
                location: photo.location || "Madrid, España",
                country: photo.country || "España",
                countryCode: photo.countryCode || null,
                noteTitle: photo.noteTitle || '',
                noteDescription: photo.noteDescription || '',
                dbId: photo.dbId || null // Preserve DB ID if exists
            });
        }
        
        if (photosToSave.length === 0) {
            console.warn('No hay fotos válidas para guardar');
            return;
        }
        
        // Create versioned data structure
        const dataWithVersion = {
            schemaVersion: SCHEMA_VERSION,
            exportDate: new Date().toISOString(),
            photos: photosToSave
        };
        
        const jsonString = JSON.stringify(dataWithVersion);
        const sizeInMB = (jsonString.length / (1024 * 1024)).toFixed(2);
        console.log(`📦 Tamaño de datos: ${sizeInMB} MB (Schema v${SCHEMA_VERSION})`);
        
        // Check if size is too large (localStorage limit is typically 5-10MB)
        if (jsonString.length > 4 * 1024 * 1024) {
            console.warn('⚠️ Datos muy grandes, comprimiendo más...');
            // Re-compress with lower quality
            const smallerPhotos = [];
            for (const photo of photosToSave) {
                let url = photo.url;
                if (url.startsWith('data:')) {
                    url = await compressImage(url, 400, 0.4);
                }
                smallerPhotos.push({...photo, url});
            }
            const smallerJson = JSON.stringify(smallerPhotos);
            localStorage.setItem(getPhotosStorageKey(), smallerJson);
        } else {
            localStorage.setItem(getPhotosStorageKey(), jsonString);
        }
        
        // Verify it was saved
        const saved = localStorage.getItem(getPhotosStorageKey());
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log(`✅ Guardadas ${parsed.length} fotos en localStorage (verificado)`);
        } else {
            console.error('❌ Error: No se pudo verificar el guardado');
        }
    } catch (error) {
        console.error('❌ Error guardando fotos:', error);
        
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            console.warn('⚠️ LocalStorage lleno, guardando menos fotos...');
            showToast('Espacio limitado: algunas fotos no se guardarán', 'error');
            
            try {
                // Try with fewer photos and more compression
                const fewPhotos = photos.slice(-10);
                const compressedFew = [];
                for (const photo of fewPhotos) {
                    let url = photo.url;
                    if (url.startsWith('data:')) {
                        url = await compressImage(url, 300, 0.3);
                    }
                    compressedFew.push({
                        id: photo.id,
                        url: url,
                        lat: photo.lat,
                        lon: photo.lon,
                        date: photo.date || 'Fecha desconocida',
                        location: photo.location || "Madrid, España",
                        country: photo.country || "España"
                    });
                }
                localStorage.setItem(getPhotosStorageKey(), JSON.stringify(compressedFew));
                console.log('Guardadas últimas 10 fotos (comprimidas)');
            } catch (e) {
                console.error('No se pudo guardar:', e);
            }
        }
    }
}

/** Load saved photos from localStorage */
function loadSavedPhotos() {
    try {
        // Ensure user is authenticated before loading
        if (!isAuthenticated()) {
            console.log('Usuario no autenticado, no se cargan fotos');
            return;
        }
        
        const storageKey = getPhotosStorageKey();
        console.log(`📸 Cargando fotos con clave: ${storageKey}`);
        
        const savedData = localStorage.getItem(storageKey);
        if (!savedData) {
            console.log('No hay fotos guardadas en localStorage para este usuario');
            
            // Clean up old photos from previous sessions (without userId)
            const oldKey = 'viajes-fran-photos';
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                console.log('⚠️ Encontradas fotos antiguas (sin userId), limpiando...');
                localStorage.removeItem(oldKey);
            }
            return;
        }
        
        const parsedData = JSON.parse(savedData);
        
        // Handle versioned data structure
        let photosData;
        let schemaVersion = 0; // Legacy format
        
        if (parsedData.schemaVersion !== undefined) {
            // New versioned format
            schemaVersion = parsedData.schemaVersion;
            photosData = parsedData.photos || [];
            console.log(`📸 Cargando ${photosData.length} fotos (Schema v${schemaVersion})`);
        } else if (Array.isArray(parsedData)) {
            // Legacy format (direct array)
            photosData = parsedData;
            console.log(`📸 Cargando ${photosData.length} fotos (formato legacy, migrando...)`);
        } else {
            console.error('Formato de datos no reconocido');
            return;
        }
        
        if (!Array.isArray(photosData)) {
            console.error('Los datos guardados no son un array válido');
            return;
        }
        
        let loadedCount = 0;
        photosData.forEach((photoData, index) => {
            try {
                // Validate required fields
                if (!photoData.url || photoData.lat === undefined || photoData.lon === undefined) {
                    console.warn(`Foto ${index + 1} inválida (faltan campos requeridos)`);
                    return;
                }
                
                // Ensure all fields have default values
                const photo = {
                    id: photoData.id || Date.now() + index,
                    url: photoData.url,
                    lat: Number(photoData.lat),
                    lon: Number(photoData.lon),
                    date: photoData.date || 'Fecha desconocida',
                    location: photoData.location || "Madrid, España",
                    country: photoData.country || "España",
                    countryCode: photoData.countryCode || null,
                    noteTitle: photoData.noteTitle || '',
                    noteDescription: photoData.noteDescription || '',
                    dbId: photoData.dbId || null, // Database ID if synced
                    hasImage: true // Local photos have images
                };
                
                photos.push(photo);
                addPhotoToMap(photo);
                
                // If photo has dbId, mark as synced
                if (photo.dbId) {
                    syncedPhotoIds.add(photo.id);
                } else {
                    // Sync to cloud if not already synced
                    syncPhotoToCloud(photo).catch(err => {
                        console.warn('Cloud sync failed:', err);
                    });
                }
                
                loadedCount++;
                
                // Try to get location name if it's still Madrid default
                if (photo.location === "Madrid, España") {
                    setTimeout(() => {
                        getLocationName(photo.lat, photo.lon, photo.id);
                    }, 1000 * (index % 5)); // Stagger requests
                } else {
                    // Group by city if we have location
                    groupByCity(photo);
                    
                    // If we don't have countryCode, try to get it from geocoding
                    if (!photo.countryCode && photo.lat && photo.lon) {
                        setTimeout(() => {
                            getLocationName(photo.lat, photo.lon, photo.id);
                        }, 1000 * (index % 5));
                    }
                }
            } catch (error) {
                console.error(`Error procesando foto ${index + 1}:`, error);
            }
        });
        
        console.log(`✅ ${loadedCount} fotos cargadas exitosamente`);
        updateStats();
        updatePhotoCarousel();
    } catch (error) {
        console.error('❌ Error cargando fotos guardadas:', error);
    }
}

/**
 * Find the city name for a given photo
 * @param {Object} photo - Photo object
 * @returns {string|null} City name or null
 */
function findCityForPhoto(photo) {
    for (const [cityName, cityGroup] of Object.entries(cityGroups)) {
        if (cityGroup.photos.find(p => p.id === photo.id)) {
            return cityName;
        }
    }
    return null;
}

// ==========================================
// CAROUSELS
// ==========================================

/** Update photo carousel */
async function updatePhotoCarousel() {
    try {
        const carouselTrack = document.getElementById('carousel-track');
        const carousel = document.getElementById('photo-carousel');
        if (!carouselTrack || !carousel) {
            console.log('Carousel elements not found');
            return;
        }
        
        // Hide carousel if no photos
        if (!photos || photos.length === 0) {
            carousel.style.display = 'none';
            return;
        }
        
        carousel.style.display = 'block';
        
        // Get all photos
        let photosToShow = [...photos];
        
        // If we have less than 24 photos, repeat them to reach 24
        if (photosToShow.length < 24 && photosToShow.length > 0) {
            const needed = 24 - photosToShow.length;
            for (let i = 0; i < needed; i++) {
                photosToShow.push(photosToShow[i % photosToShow.length]);
            }
        } else if (photosToShow.length > 24) {
            // If we have more than 24, take first 24
            photosToShow = photosToShow.slice(0, 24);
        }
        
        // Now duplicate the set for seamless infinite scroll (always show 24, duplicate to 48)
        const duplicatedPhotos = [...photosToShow, ...photosToShow];
        
        // Clear existing items
        carouselTrack.innerHTML = '';
        
        // Add photos to carousel
        duplicatedPhotos.forEach((photo, index) => {
            if (!photo || !photo.url) return;
            
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            carouselItem.innerHTML = `<img src="${photo.url}" alt="Foto ${index + 1}">`;
            carouselItem.addEventListener('click', () => {
                // Find which city this photo belongs to and show gallery
                const cityName = findCityForPhoto(photo);
                if (cityName) {
                    showCityPhotoGallery(cityName);
                } else {
                    // Fallback: show photo in new window
                    window.open(photo.url, '_blank');
                }
            });
            carouselTrack.appendChild(carouselItem);
        });
    } catch (error) {
        console.error('Error updating photo carousel:', error);
    }
}

// ==========================================
// STATISTICS
// ==========================================
function updateStats() {
    document.getElementById('total-photos').textContent = photos.length;
    // Count unique cities instead of exact locations
    const uniqueCities = new Set();
    Object.values(cityGroups).forEach(city => {
        if (city.city) {
            uniqueCities.add(city.city);
        }
    });
    document.getElementById('total-locations').textContent = uniqueCities.size > 0 ? uniqueCities.size : Object.keys(locationGroups).length;
    
    // Count unique countries
    const countries = new Set();
    
    // Use cityGroups as primary source (most reliable)
    Object.values(cityGroups).forEach(cityGroup => {
        if (cityGroup.country) {
            countries.add(cityGroup.country);
        }
    });
    
    // Also check photos directly for countries not yet in cityGroups
    photos.forEach(photo => {
        if (photo.country && !countries.has(photo.country)) {
            countries.add(photo.country);
        }
    });
    
    // Fallback: try to extract from location string only if no country found
    if (countries.size === 0) {
        photos.forEach(photo => {
            if (photo.location && !photo.country) {
                // Extract country from location string (usually at the end after a comma)
                const parts = photo.location.split(',');
                if (parts.length > 1) {
                    // Take the last part as country (format: "City, Country" or "City, State, Country")
                    const country = parts[parts.length - 1].trim();
                    // Only add if it looks like a country name (not too long, not coordinates)
                    if (country && country.length > 0 && country.length < 50 && !country.match(/^\d+\.?\d*°$/)) {
                        countries.add(country);
                    }
                }
            }
        });
    }
    
    document.getElementById('total-countries').textContent = countries.size;
    
    // Update flags carousel
    updateFlagsCarousel(countries);
}

// Update flags carousel
function updateFlagsCarousel(countries) {
    const flagsCarousel = document.getElementById('flags-carousel');
    const flagsTrack = document.getElementById('flags-track');
    
    if (!flagsCarousel || !flagsTrack) return;
    
    // Hide if no countries
    if (!countries || countries.size === 0) {
        flagsCarousel.style.display = 'none';
        return;
    }
    
    flagsCarousel.style.display = 'block';
    
    // Convert countries to flags - using all photos to ensure we get all countries
    const countryFlags = [];
    const seenCountries = new Set();
    
    console.log('🏁 Detectando banderas de países...');
    
    photos.forEach(photo => {
        if (!photo.country) return;
        
        const country = photo.country.trim();
        if (seenCountries.has(country)) return;
        
        const flag = getCountryFlag(country, photo.countryCode);
        
        console.log(`País: "${country}", Código: "${photo.countryCode || 'N/A'}", Bandera: ${flag}`);
        
        // Only add if we got a valid flag (not the world emoji)
        if (flag && flag !== '🌍') {
            countryFlags.push({ country, flag });
            seenCountries.add(country);
        }
    });
    
    console.log(`Total banderas detectadas: ${countryFlags.length}`);
    
    if (countryFlags.length === 0) {
        flagsCarousel.style.display = 'none';
        return;
    }
    
    // Need minimum 30 items for smooth infinite scroll
    let flagsToShow = [...countryFlags];
    while (flagsToShow.length < 30) {
        flagsToShow = [...flagsToShow, ...countryFlags];
    }
    
    // Duplicate for seamless infinite scroll
    const totalFlags = flagsToShow.length;
    flagsToShow = [...flagsToShow, ...flagsToShow];
    
    // Clear and populate
    flagsTrack.innerHTML = '';
    flagsToShow.forEach(({ country, flag }) => {
        const flagItem = document.createElement('span');
        flagItem.className = 'flag-item';
        flagItem.textContent = flag;
        flagItem.title = country;
        flagItem.dataset.country = country; // Store country name for click handler
        flagItem.style.cursor = 'pointer'; // Make it clear it's clickable
        
        // Add click handler to show photos from this country
        flagItem.addEventListener('click', () => {
            const countryPhotos = photos.filter(photo => photo.country && photo.country.trim() === country);
            if (countryPhotos.length > 0) {
                showCountryPhotosModal(country, countryPhotos);
            }
        });
        
        flagsTrack.appendChild(flagItem);
    });
    
    // Calculate animation dynamically
    // Each flag is 30px wide + 15px gap = 45px per item
    const itemWidth = 45;
    const scrollDistance = (totalFlags) * itemWidth;
    
    // Create dynamic keyframes for this specific scroll distance
    const styleId = 'flags-carousel-animation';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        @keyframes scrollFlags {
            0% {
                transform: translateX(0);
            }
            100% {
                transform: translateX(-${scrollDistance}px);
            }
        }
    `;
    
    // Reset animation
    flagsTrack.style.animation = 'none';
    flagsTrack.offsetHeight; // Trigger reflow
    flagsTrack.style.animation = 'scrollFlags 30s linear infinite';
}

// ==========================================
// FLAGS & COUNTRY UTILITIES
// ==========================================

/**
 * Get flag emoji for a country name or code
 * @param {string} countryName - Country name
 * @param {string} countryCode - ISO 3166-1 alpha-2 code (optional)
 * @returns {string} Flag emoji
 */
function getCountryFlag(countryName, countryCode) {
    // If we already have the ISO code, use it directly (it's the most reliable)
    if (countryCode && countryCode.length === 2) {
        return countryCodeToFlag(countryCode);
    }
    
    if (!countryName) return '🌍';
    
    // Normalize name (lowercase and remove accents)
    const normalized = countryName.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    
    // Try exact match in our dictionary
    let code = COUNTRY_TO_CODE[normalized];
    
    // If not found, try partial match
    if (!code) {
        for (const [name, c] of Object.entries(COUNTRY_TO_CODE)) {
            if (normalized.includes(name) || name.includes(normalized)) {
                code = c;
                break;
            }
        }
    }
    
    // Convert code to flag emoji
    if (code && code.length === 2) {
        return countryCodeToFlag(code);
    }
    
    // Default world flag if country not found
    return '🌍';
}

// ==========================================
// MAP CONTROLS
// ==========================================

/** Fit map bounds to show all photos */
function fitMapToPhotos() {
    if (markers.length === 0) {
        showToast('No hay fotos en el mapa', 'error');
        return;
    }
    
    const bounds = markers.map(m => [m.marker.getLatLng().lat, m.marker.getLatLng().lng]);
    map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
    showToast(`Mostrando ${markers.length} ubicación${markers.length > 1 ? 'es' : ''}`, 'success');
}

// ==========================================
// COUNTRIES MODAL
// ==========================================

/** Show countries modal with photos grouped by country */
async function showCountriesModal() {
    const countriesModal = document.getElementById('countries-modal');
    const countriesList = document.getElementById('countries-list');
    const countriesCount = document.getElementById('countries-count');
    
    if (!countriesModal || !countriesList) return;
    
    // Group photos by country
    const countriesMap = new Map();
    
    photos.forEach(photo => {
        if (!photo.country) return;
        
        const country = photo.country.trim();
        if (!countriesMap.has(country)) {
            countriesMap.set(country, {
                name: country,
                code: photo.countryCode || null,
                photos: []
            });
        }
        countriesMap.get(country).photos.push(photo);
    });
    
    const countries = Array.from(countriesMap.values()).sort((a, b) => 
        b.photos.length - a.photos.length
    );
    
    countriesCount.textContent = `${countries.length} país${countries.length !== 1 ? 'es' : ''}`;
    
    // Clear and populate list
    countriesList.innerHTML = '';
    
    if (countries.length === 0) {
        countriesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">No hay fotos por país</p>
                <p>Carga fotos para verlas agrupadas por país</p>
            </div>
        `;
    } else {
        // Process countries sequentially to use await
        for (const country of countries) {
            const countryItem = document.createElement('div');
            countryItem.className = 'country-item';
            
            const flag = getCountryFlag(country.name, country.code);
            const photoCount = country.photos.length;
            
            // Show first 6 photos as preview
            const previewPhotos = country.photos.slice(0, 6);
            const remainingCount = country.photos.length - 6;
            
            // Build photo previews with cloud URLs
            const photoPreviews = await Promise.all(
                previewPhotos.map(async (photo) => {
                    const photoUrl = await getPhotoUrl(photo, true) || await getPhotoUrl(photo, false) || photo.url;
                    return `
                        <div class="country-photo-item">
                            ${photoUrl ? `<img src="${photoUrl}" alt="Foto de ${country.name}" loading="lazy">` : `
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                            background: var(--bg-secondary); color: var(--text-secondary);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                            `}
                        </div>
                    `;
                })
            );
            
            countryItem.innerHTML = `
                <div class="country-header">
                    <span class="country-flag">${flag}</span>
                    <div class="country-info">
                        <div class="country-name">${country.name}</div>
                        <div class="country-stats">${photoCount} foto${photoCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="country-photos">
                    ${photoPreviews.join('')}
                    ${remainingCount > 0 ? `
                        <div class="country-photo-item" style="display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border: 2px dashed var(--border-color); color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">
                            +${remainingCount} más
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Add click handler to show all photos from this country
            countryItem.addEventListener('click', () => {
                showCountryPhotosModal(country.name, country.photos);
            });
            
            countriesList.appendChild(countryItem);
        }
    }
    
    countriesModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close countries modal
function closeCountriesModal() {
    const countriesModal = document.getElementById('countries-modal');
    if (countriesModal) {
        countriesModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Show all photos from a country
async function showCountryPhotosModal(countryName, countryPhotos) {
    closeCountriesModal();
    
    // Create a temporary modal or use the existing photo modal
    const modal = document.getElementById('photo-modal');
    const modalLocation = document.getElementById('modal-location');
    const modalDate = document.getElementById('modal-date');
    const photoGallery = document.getElementById('photo-gallery');
    
    const flag = getCountryFlag(countryName);
    modalLocation.textContent = `${flag} ${countryName}`;
    modalDate.textContent = `${countryPhotos.length} foto${countryPhotos.length > 1 ? 's' : ''}`;
    
    // Clear and populate gallery
    photoGallery.innerHTML = '';
    countryPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        // Create photo content
        let photoHTML = `
            <img src="${photo.url}" alt="Foto">
            <div class="photo-item-actions">
                <button class="edit-note-btn" data-photo-id="${photo.id}">
                    📝 Nota
                </button>
            </div>
        `;
        
        // Add note display if exists
        if (photo.noteTitle || photo.noteDescription) {
            photoHTML += `
                <div class="photo-note-display">
                    ${photo.noteTitle ? `<div class="photo-note-title">${photo.noteTitle}</div>` : ''}
                    ${photo.noteDescription ? `<div class="photo-note-description">${photo.noteDescription}</div>` : ''}
                </div>
            `;
        }
        
        photoItem.innerHTML = photoHTML;
        
        // Click on image opens full size
        photoItem.querySelector('img').addEventListener('click', () => {
            window.open(photo.url, '_blank');
        });
        
        // Click on edit note button
        const editBtn = photoItem.querySelector('.edit-note-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openPhotoNoteModal(photo.id);
            });
        }
        
        photoGallery.appendChild(photoItem);
    });
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type (success, error, info)
 */
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ==========================================
// SETTINGS & BACKUP FUNCTIONALITY
// ==========================================

// Show settings modal
function showSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const totalPhotosInfo = document.getElementById('total-photos-info');
    
    if (!settingsModal) return;
    
    // Update info
    if (totalPhotosInfo) {
        totalPhotosInfo.textContent = photos.length;
    }
    
    settingsModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close settings modal
function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Export backup as JSON file
async function exportBackup() {
    try {
        if (photos.length === 0) {
            showToast('No hay fotos para exportar', 'error');
            return;
        }
        
        // Prepare backup data with all photo information
        const backupData = {
            schemaVersion: SCHEMA_VERSION,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0',
            totalPhotos: photos.length,
            photos: photos.map(photo => ({
                id: photo.id,
                url: photo.url,
                lat: photo.lat,
                lon: photo.lon,
                date: photo.date,
                location: photo.location,
                country: photo.country,
                countryCode: photo.countryCode,
                noteTitle: photo.noteTitle || '',
                noteDescription: photo.noteDescription || ''
            }))
        };
        
        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        a.download = `viajes-backup-${timestamp}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Backup exportado: ${photos.length} fotos`, 'success');
        console.log('✅ Backup exportado exitosamente');
        
    } catch (error) {
        console.error('Error exportando backup:', error);
        showToast('Error al exportar backup', 'error');
    }
}

// Import backup from JSON file
function importBackup() {
    const input = document.getElementById('import-backup-input');
    if (!input) return;
    
    input.click();
}

// Process imported backup file
async function processImportedBackup(file) {
    try {
        if (!file) return;
        
        // Read file
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        // Validate data structure
        if (!importedData.schemaVersion) {
            if (confirm('Este archivo no tiene versión de esquema. ¿Quieres intentar importarlo de todos modos? (Formato legacy)')) {
                // Try to import as legacy format
                if (Array.isArray(importedData)) {
                    await importLegacyFormat(importedData);
                    return;
                }
            }
            showToast('Formato de backup no válido', 'error');
            return;
        }
        
        // Check schema version compatibility
        if (importedData.schemaVersion > SCHEMA_VERSION) {
            showToast(`Backup de versión más reciente (v${importedData.schemaVersion}). Actualiza la app.`, 'error');
            return;
        }
        
        // Validate photos array
        if (!Array.isArray(importedData.photos) || importedData.photos.length === 0) {
            showToast('El backup no contiene fotos válidas', 'error');
            return;
        }
        
        // Confirm before importing
        const confirmMsg = `¿Importar ${importedData.photos.length} fotos?\n\nEsto ${photos.length > 0 ? 'reemplazará' : 'cargará'} las fotos actuales.`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Clear current data
        markers.forEach(m => map && map.removeLayer(m.marker));
        markers = [];
        photos = [];
        locationGroups = {};
        cityGroups = {};
        
        // Import photos
        let importedCount = 0;
        importedData.photos.forEach((photoData, index) => {
            try {
                // Validate required fields
                if (!photoData.url || photoData.lat === undefined || photoData.lon === undefined) {
                    console.warn(`Foto ${index + 1} inválida en backup`);
                    return;
                }
                
                const photo = {
                    id: photoData.id || Date.now() + index,
                    url: photoData.url,
                    lat: Number(photoData.lat),
                    lon: Number(photoData.lon),
                    date: photoData.date || 'Fecha desconocida',
                    location: photoData.location || "Madrid, España",
                    country: photoData.country || "España",
                    countryCode: photoData.countryCode || null,
                    noteTitle: photoData.noteTitle || '',
                    noteDescription: photoData.noteDescription || ''
                };
                
                photos.push(photo);
                addPhotoToMap(photo);
                importedCount++;
                
                // Group by city if we have location
                if (photo.location && photo.location !== "Madrid, España") {
                    groupByCity(photo);
                }
                
            } catch (error) {
                console.error(`Error procesando foto ${index + 1}:`, error);
            }
        });
        
        // Save to localStorage
        await savePhotosToLocalStorage();
        
        // Update UI
        updateStats();
        updatePhotoCarousel();
        
        // Close settings modal
        closeSettingsModal();
        
        showToast(`✅ ${importedCount} fotos importadas exitosamente`, 'success');
        console.log(`✅ Backup importado: ${importedCount} fotos`);
        
    } catch (error) {
        console.error('Error importando backup:', error);
        showToast('Error al importar backup. Verifica el archivo.', 'error');
    }
}

// Import legacy format (array of photos)
async function importLegacyFormat(photosArray) {
    // Similar logic but for legacy format
    showToast('Importando formato legacy...', 'info');
    // Implementation similar to processImportedBackup but for array format
}

// ==========================================
// CITY SELECTION FOR PHOTOS WITHOUT GPS
// ==========================================

// Show the next city selection modal
function showNextCitySelectionModal() {
    if (photosWithoutGPSQueue.length === 0) {
        // All photos processed
        if (photos.length > 0) {
            showToast('Todas las fotos han sido procesadas', 'success');
            savePhotosToLocalStorage();
        }
        return;
    }
    
    // Get next photo from queue
    currentPhotoWithoutGPS = photosWithoutGPSQueue[0];
    selectedCity = null;
    
    // Update modal UI
    const modal = document.getElementById('city-select-modal');
    const image = document.getElementById('city-select-image');
    const progress = document.getElementById('city-select-progress');
    const input = document.getElementById('city-search-input');
    const confirmBtn = document.getElementById('confirm-city-btn');
    const suggestions = document.getElementById('city-suggestions');
    
    // Set image
    image.src = currentPhotoWithoutGPS.url;
    
    // Update progress
    const totalWithoutGPS = photosWithoutGPSQueue.length;
    const currentIndex = 1;
    progress.textContent = `Foto ${currentIndex} de ${totalWithoutGPS} sin ubicación`;
    
    // Reset input and button
    input.value = '';
    confirmBtn.disabled = true;
    suggestions.classList.remove('show');
    suggestions.innerHTML = '';
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus input
    setTimeout(() => input.focus(), 100);
}

// Close city selection modal
function closeCitySelectionModal() {
    const modal = document.getElementById('city-select-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Search cities using Nominatim API
let searchTimeout = null;
async function searchCities(query) {
    if (!query || query.length < 2) {
        hideCitySuggestions();
        return;
    }
    
    const suggestions = document.getElementById('city-suggestions');
    suggestions.innerHTML = '<div class="city-suggestions-loading">🔍 Buscando ciudades...</div>';
    suggestions.classList.add('show');
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&featuretype=city`,
            {
                headers: {
                    'User-Agent': 'Viajes-Fran-App/1.0'
                }
            }
        );
        const data = await response.json();
        
        if (data.length === 0) {
            suggestions.innerHTML = '<div class="city-suggestions-empty">No se encontraron ciudades. Intenta con otro nombre.</div>';
            return;
        }
        
        // Filter and format results
        const cities = data.map(item => {
            const address = item.address || {};
            const cityName = address.city || address.town || address.village || address.municipality || item.name;
            const country = address.country || '';
            const countryCode = address.country_code ? address.country_code.toUpperCase() : '';
            
            return {
                name: cityName,
                displayName: item.display_name,
                country: country,
                countryCode: countryCode,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                flag: countryCodeToFlag(countryCode)
            };
        }).filter(city => city.name);
        
        // Remove duplicates
        const uniqueCities = [];
        const seen = new Set();
        for (const city of cities) {
            const key = `${city.name}-${city.country}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCities.push(city);
            }
        }
        
        if (uniqueCities.length === 0) {
            suggestions.innerHTML = '<div class="city-suggestions-empty">No se encontraron ciudades. Intenta con otro nombre.</div>';
            return;
        }
        
        // Render suggestions
        suggestions.innerHTML = '';
        uniqueCities.forEach(city => {
            const item = document.createElement('div');
            item.className = 'city-suggestion-item';
            item.innerHTML = `
                <span class="city-suggestion-flag">${city.flag}</span>
                <div class="city-suggestion-info">
                    <div class="city-suggestion-name">${city.name}</div>
                    <div class="city-suggestion-country">${city.country}</div>
                </div>
            `;
            item.addEventListener('click', () => selectCity(city));
            suggestions.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error buscando ciudades:', error);
        suggestions.innerHTML = '<div class="city-suggestions-empty">Error al buscar. Intenta de nuevo.</div>';
    }
}

// Convert country code to flag emoji
function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// Select a city from suggestions
function selectCity(city) {
    selectedCity = city;
    
    // Update input
    const input = document.getElementById('city-search-input');
    input.value = `${city.name}, ${city.country}`;
    
    // Enable confirm button
    const confirmBtn = document.getElementById('confirm-city-btn');
    confirmBtn.disabled = false;
    
    // Hide suggestions and highlight selected
    const suggestions = document.getElementById('city-suggestions');
    const items = suggestions.querySelectorAll('.city-suggestion-item');
    items.forEach(item => item.classList.remove('selected'));
    event.target.closest('.city-suggestion-item').classList.add('selected');
    
    // Hide suggestions after short delay
    setTimeout(() => {
        suggestions.classList.remove('show');
    }, 200);
}

// Hide city suggestions
function hideCitySuggestions() {
    const suggestions = document.getElementById('city-suggestions');
    suggestions.classList.remove('show');
    suggestions.innerHTML = '';
}

// Confirm city selection
function confirmCitySelection() {
    if (!selectedCity || !currentPhotoWithoutGPS) return;
    
    // Create photo with selected city coordinates
    const photo = {
        id: currentPhotoWithoutGPS.id,
        url: currentPhotoWithoutGPS.url,
        lat: selectedCity.lat,
        lon: selectedCity.lon,
        date: currentPhotoWithoutGPS.date,
        location: `${selectedCity.name}, ${selectedCity.country}`,
        country: selectedCity.country,
        noteTitle: '',
        noteDescription: ''
    };
    
    // Add to photos array
    photos.push(photo);
    addPhotoToMap(photo);
    
    // Sync to cloud database (async, non-blocking)
    syncPhotoToCloud(photo).catch(err => {
        console.warn('Cloud sync failed:', err);
    });
    
    updatePhotoCarousel();
    updateStats();
    
    // Remove from queue
    photosWithoutGPSQueue.shift();
    
    // Save to localStorage
    savePhotosToLocalStorage();
    
    // Close modal and show next if any
    closeCitySelectionModal();
    
    if (photosWithoutGPSQueue.length > 0) {
        setTimeout(() => {
            showNextCitySelectionModal();
        }, 300);
    } else {
        showToast('Todas las fotos han sido procesadas', 'success');
    }
}

// Skip photo without GPS
function skipPhotoWithoutGPS() {
    if (!currentPhotoWithoutGPS) return;
    
    // Remove from queue without adding to map
    photosWithoutGPSQueue.shift();
    
    // Close modal and show next if any
    closeCitySelectionModal();
    
    if (photosWithoutGPSQueue.length > 0) {
        setTimeout(() => {
            showNextCitySelectionModal();
        }, 300);
    } else {
        if (photos.length > 0) {
            showToast('Fotos procesadas (algunas omitidas)', 'success');
            savePhotosToLocalStorage();
        }
    }
}

// Setup city search input
function setupCitySearch() {
    const input = document.getElementById('city-search-input');
    const confirmBtn = document.getElementById('confirm-city-btn');
    const skipBtn = document.getElementById('skip-photo-btn');
    
    if (!input) return;
    
    // Search on input with debounce
    input.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        selectedCity = null;
        confirmBtn.disabled = true;
        
        searchTimeout = setTimeout(() => {
            searchCities(e.target.value);
        }, 300);
    });
    
    // Handle keyboard navigation
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideCitySuggestions();
        } else if (e.key === 'Enter' && selectedCity) {
            confirmCitySelection();
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.city-select-input-container')) {
            hideCitySuggestions();
        }
    });
    
    // Confirm and skip buttons
    confirmBtn.addEventListener('click', confirmCitySelection);
    skipBtn.addEventListener('click', skipPhotoWithoutGPS);
}

// Setup photo note modal
function setupPhotoNoteModal() {
    const noteModal = document.getElementById('photo-note-modal');
    const closeNote = document.querySelector('.close-note');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const cancelNoteBtn = document.getElementById('cancel-note-btn');
    
    if (!noteModal) return;
    
    // Close modal
    if (closeNote) {
        closeNote.addEventListener('click', closePhotoNoteModal);
    }
    
    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', closePhotoNoteModal);
    }
    
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', savePhotoNote);
    }
    
    // Close when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === noteModal) {
            closePhotoNoteModal();
        }
    });
}

// Open photo note modal
function openPhotoNoteModal(photoId) {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    currentNotePhotoId = photoId;
    
    const modal = document.getElementById('photo-note-modal');
    const preview = document.getElementById('note-photo-preview');
    const titleInput = document.getElementById('photo-note-title');
    const descriptionInput = document.getElementById('photo-note-description');
    
    if (!modal) return;
    
    // Set preview image
    preview.src = photo.url;
    
    // Set existing note data if any
    titleInput.value = photo.noteTitle || '';
    descriptionInput.value = photo.noteDescription || '';
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus on title input
    setTimeout(() => titleInput.focus(), 100);
}

// Close photo note modal
function closePhotoNoteModal() {
    const modal = document.getElementById('photo-note-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        currentNotePhotoId = null;
    }
}

// Save photo note
function savePhotoNote() {
    if (!currentNotePhotoId) return;
    
    const photo = photos.find(p => p.id === currentNotePhotoId);
    if (!photo) return;
    
    const titleInput = document.getElementById('photo-note-title');
    const descriptionInput = document.getElementById('photo-note-description');
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    
    // Save note to photo object
    photo.noteTitle = title;
    photo.noteDescription = description;
    
    // Update in cloud database (async, non-blocking)
    updatePhotoInCloud(photo).catch(err => {
        console.warn('Cloud update failed:', err);
    });
    
    // Save to localStorage
    savePhotosToLocalStorage();
    
    // Close modal
    closePhotoNoteModal();
    
    // Show success message
    if (title || description) {
        showToast('Nota guardada exitosamente', 'success');
    } else {
        showToast('Nota eliminada', 'success');
    }
}

