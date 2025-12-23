/**
 * ==========================================
 * AUTHENTICATION MODULE
 * ==========================================
 * Handles user authentication with localStorage-based sessions.
 * Designed to be easily migrated to Firebase Auth or custom backend.
 */

// ==========================================
// CONSTANTS
// ==========================================

const AUTH_STORAGE_KEY = 'viajes-fran-auth';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ==========================================
// STATE
// ==========================================

let currentUser = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// ==========================================
// AUTH STATE MANAGEMENT
// ==========================================

/**
 * Check if user is authenticated and show appropriate screen
 */
function checkAuthState() {
    const userData = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const now = Date.now();
            
            if (user.expiresAt && now < user.expiresAt) {
                currentUser = user;
                showApp();
                return;
            }
            // Session expired
            logout();
        } catch (error) {
            console.error('Error parsing auth data:', error);
            logout();
        }
    }
    
    showLogin();
}

/**
 * Show login screen, hide app
 */
function showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    
    setupLoginListeners();
}

/**
 * Show app (user is authenticated), hide login
 */
function showApp() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    // Clean up old photos from previous sessions (without userId)
    cleanupLegacyPhotos();
    
    // Initialize app with delay to ensure scripts are loaded
    setTimeout(initializeAppIfReady, 100);
}

/**
 * Remove photos stored without userId (legacy format)
 */
function cleanupLegacyPhotos() {
    const oldKey = 'viajes-fran-photos';
    const oldData = localStorage.getItem(oldKey);
    
    if (oldData && getCurrentUserId()) {
        console.log('⚠️ Limpiando fotos antiguas (sin userId)...');
        localStorage.removeItem(oldKey);
    }
}

/**
 * Initialize app if not already initialized
 */
function initializeAppIfReady() {
    if (typeof initializeApp !== 'function') {
        console.warn('initializeApp not available yet, retrying...');
        setTimeout(initializeAppIfReady, 100);
        return;
    }
    
    if (!window.appInitialized) {
        window.appInitialized = true;
        
        // Clear app state first
        if (typeof clearAppState === 'function') {
            clearAppState();
        }
        
        initializeApp();
    }
}

// ==========================================
// LOGIN HANDLERS
// ==========================================

/**
 * Setup event listeners for login form
 */
function setupLoginListeners() {
    const magicLinkBtn = document.getElementById('magic-link-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const emailInput = document.getElementById('login-email');
    
    if (magicLinkBtn) {
        magicLinkBtn.onclick = handleMagicLink;
    }
    
    if (googleLoginBtn) {
        googleLoginBtn.onclick = handleGoogleLogin;
    }
    
    if (emailInput) {
        emailInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                handleMagicLink();
            }
        };
    }
}

/**
 * Handle magic link login
 */
async function handleMagicLink() {
    const emailInput = document.getElementById('login-email');
    const btn = document.getElementById('magic-link-btn');
    
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showLoginMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    
    // Disable button and show loading state
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
    }
    
    try {
        await simulateMagicLink(email);
        
        showLoginMessage('¡Magic link enviado! (Demo: sesión creada automáticamente)', 'success');
        
        // In production, user would click link in email
        // For demo, create session after delay
        setTimeout(() => {
            createSession(email, 'magic-link');
        }, 1500);
        
    } catch (error) {
        console.error('Error sending magic link:', error);
        showLoginMessage('Error al enviar magic link. Intenta de nuevo.', 'error');
        resetMagicLinkButton(btn);
    }
}

/**
 * Reset magic link button to original state
 */
function resetMagicLinkButton(btn) {
    if (!btn) return;
    
    btn.disabled = false;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        Enviar Magic Link
    `;
}

/**
 * Handle Google login
 * Uses the email from the input field if provided, otherwise prompts
 */
async function handleGoogleLogin() {
    const btn = document.getElementById('google-login-btn');
    const emailInput = document.getElementById('login-email');
    
    // Check if user already entered an email
    let email = emailInput ? emailInput.value.trim() : '';
    
    // If no email entered, prompt for one (simulating Google returning an email)
    if (!email) {
        email = prompt('Simular Google OAuth:\nIngresa tu email para continuar:', 'usuario@gmail.com');
        if (!email || !isValidEmail(email)) {
            showLoginMessage('Por favor ingresa un email válido', 'error');
            return;
        }
    }
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Conectando...</span>';
    }
    
    try {
        // Simulate Google OAuth delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        createSession(email, 'google');
        
    } catch (error) {
        console.error('Error with Google login:', error);
        showLoginMessage('Error al iniciar sesión con Google. Intenta de nuevo.', 'error');
        resetGoogleButton(btn);
    }
}

/**
 * Reset Google button to original state
 */
function resetGoogleButton(btn) {
    if (!btn) return;
    
    btn.disabled = false;
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
    `;
}

// ==========================================
// AUTH SIMULATION (Replace with real implementation)
// ==========================================

/**
 * Simulate magic link email send
 * @param {string} email - User email
 * @returns {Promise<{email: string, sent: boolean}>}
 */
async function simulateMagicLink(email) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ email, sent: true });
        }, 1000);
    });
}

// Note: simulateGoogleLogin removed - Google login now uses email from input field
// In production, this would be replaced with real Google OAuth

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Create user session
 * @param {string} email - User email
 * @param {string} provider - Auth provider (magic-link, google)
 */
function createSession(email, provider) {
    const userId = generateUserId(email);
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    
    const user = {
        id: userId,
        email: email,
        provider: provider,
        createdAt: Date.now(),
        expiresAt: expiresAt
    };
    
    currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    
    showApp();
}

/**
 * Generate consistent user ID from email
 * @param {string} email - User email
 * @returns {string} User ID
 */
function generateUserId(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Logout user and clear session
 */
function logout() {
    // Clear app state before logging out
    if (typeof clearAppState === 'function') {
        clearAppState();
    }
    
    currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    showLogin();
    
    // Clear login form
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.value = '';
    
    showLoginMessage('', '');
    
    // Reset app initialization flag
    window.appInitialized = false;
}

// ==========================================
// USER GETTERS
// ==========================================

/**
 * Get current user object
 * @returns {Object|null} Current user or null
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Get current user ID
 * @returns {string|null} User ID or null
 */
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    return currentUser !== null;
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Show message in login form
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error)
 */
function showLoginMessage(message, type) {
    const messageDiv = document.getElementById('login-message');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `login-message ${type}`;
    
    if (message) {
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'login-message';
        }, 5000);
    }
}

/**
 * Setup logout button listener (called from app.js)
 */
function setupLogoutListener() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout();
            }
        };
    }
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.checkAuthState = checkAuthState;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.isAuthenticated = isAuthenticated;
window.logout = logout;
window.setupLogoutListener = setupLogoutListener;
