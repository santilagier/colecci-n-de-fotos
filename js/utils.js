/**
 * ==========================================
 * UTILITY FUNCTIONS
 * ==========================================
 * Shared utility functions used across the application
 */

import { COUNTRY_TO_CODE } from './config.js';

// ==========================================
// COORDINATE UTILITIES
// ==========================================

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {Array} dms - Array of [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal degrees
 */
export function convertDMSToDD(dms, ref) {
    let dd = dms[0] + dms[1] / 60 + dms[2] / (60 * 60);
    if (ref === 'S' || ref === 'W') {
        dd = dd * -1;
    }
    return dd;
}

// ==========================================
// STRING UTILITIES
// ==========================================

/**
 * Normalize string (lowercase, remove accents, trim)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// ==========================================
// FLAG UTILITIES
// ==========================================

/**
 * Convert country code to flag emoji
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @returns {string} Flag emoji
 */
export function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

/**
 * Get flag emoji for a country name or code
 * @param {string} countryName - Country name
 * @param {string} countryCode - ISO 3166-1 alpha-2 code (optional)
 * @returns {string} Flag emoji
 */
export function getCountryFlag(countryName, countryCode) {
    // If we already have the ISO code, use it directly (most reliable)
    if (countryCode && countryCode.length === 2) {
        return countryCodeToFlag(countryCode);
    }
    
    if (!countryName) return '🌍';
    
    // Normalize name
    const normalized = normalizeString(countryName);
    
    // Try exact match in dictionary
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
// DATE UTILITIES
// ==========================================

/**
 * Format date for filename
 * @param {Date} date - Date object
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export function formatDateForFilename(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-').split('T')[0];
}

/**
 * Format date for display
 * @param {string|Date} date - Date string or object
 * @returns {string} Formatted date
 */
export function formatDateForDisplay(date) {
    if (!date || date === 'Fecha desconocida') return 'Fecha desconocida';
    try {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return date;
    }
}

// ==========================================
// VALIDATION UTILITIES
// ==========================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate photo object has required fields
 * @param {Object} photo - Photo object
 * @returns {boolean}
 */
export function isValidPhoto(photo) {
    return photo && 
           photo.url && 
           photo.lat !== undefined && 
           photo.lon !== undefined;
}

/**
 * Validate country code format
 * @param {string} code - Country code
 * @returns {boolean}
 */
export function isValidCountryCode(code) {
    return code && typeof code === 'string' && code.length === 2;
}

// ==========================================
// NUMBER UTILITIES
// ==========================================

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    return num.toLocaleString('es-ES');
}

/**
 * Round number to decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
export function roundToDecimals(num, decimals = 4) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

// ==========================================
// ARRAY UTILITIES
// ==========================================

/**
 * Remove duplicates from array based on a key function
 * @param {Array} array - Array to deduplicate
 * @param {Function} keyFn - Function to extract key from each item
 * @returns {Array} Deduplicated array
 */
export function uniqueBy(array, keyFn) {
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Group array items by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function to extract key from each item
 * @returns {Object} Object with grouped items
 */
export function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ==========================================
// OBJECT UTILITIES
// ==========================================

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean}
 */
export function isEmpty(obj) {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
}

// ==========================================
// DEBOUNCE & THROTTLE
// ==========================================

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// ERROR HANDLING
// ==========================================

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parse fails
 * @returns {*} Parsed object or fallback
 */
export function safeJSONParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('JSON parse error:', error);
        return fallback;
    }
}

/**
 * Safe async function wrapper with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Function} onError - Error handler
 * @returns {Function} Wrapped function
 */
export function safeAsync(asyncFn, onError) {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            console.error('Async error:', error);
            if (onError) onError(error);
            return null;
        }
    };
}

// ==========================================
// RANDOM UTILITIES
// ==========================================

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate hash from string (simple, non-cryptographic)
 * @param {string} str - String to hash
 * @returns {string} Hash
 */
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// ==========================================
// DOM UTILITIES
// ==========================================

/**
 * Wait for element to exist in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Prevent default event behavior
 * @param {Event} e - Event object
 */
export function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

