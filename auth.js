/**
 * ==========================================
 * AUTHENTICATION MODULE - SUPABASE
 * ==========================================
 * Handles user authentication with Supabase Auth.
 * Supports Google OAuth and Magic Link (email).
 */

// ==========================================
// STATE
// ==========================================

let currentUser = null;
let authInitialized = false;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

/**
 * Initialize Supabase Auth and check current session
 */
async function initializeAuth() {
    // Wait for Supabase to be available
    if (typeof window.supabaseClient === 'undefined') {
        console.warn('Supabase not ready, retrying...');
        setTimeout(initializeAuth, 100);
        return;
    }

    const supabase = window.supabaseClient;

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLogin();
        } else if (event === 'TOKEN_REFRESHED' && session) {
            currentUser = session.user;
        }
    });

    // Check if there's an existing session
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            showLogin();
            return;
        }

        if (session) {
            currentUser = session.user;
            showApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error initializing auth:', error);
        showLogin();
    }

    authInitialized = true;
}

// ==========================================
// UI STATE MANAGEMENT
// ==========================================

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
    
    // Initialize app with delay to ensure scripts are loaded
    setTimeout(initializeAppIfReady, 100);
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
 * Handle Magic Link login (email)
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
    
    // Disable button and show loading
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Enviando...';
    }
    
    try {
        const supabase = window.supabaseClient;
        
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                // Redirect to current page after clicking magic link
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });
        
        if (error) {
            throw error;
        }
        
        showLoginMessage('¡Magic link enviado! Revisa tu email (y la carpeta de spam)', 'success');
        
        // Reset button after delay
        setTimeout(() => resetMagicLinkButton(btn), 3000);
        
    } catch (error) {
        console.error('Error sending magic link:', error);
        showLoginMessage('Error: ' + (error.message || 'No se pudo enviar el email'), 'error');
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
 * Handle Google OAuth login
 */
async function handleGoogleLogin() {
    const btn = document.getElementById('google-login-btn');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Conectando...</span>';
    }
    
    try {
        const supabase = window.supabaseClient;
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        
        if (error) {
            throw error;
        }
        
        // User will be redirected to Google, then back to the app
        // Auth state change listener will handle the rest
        
    } catch (error) {
        console.error('Error with Google login:', error);
        showLoginMessage('Error: ' + (error.message || 'No se pudo iniciar sesión con Google'), 'error');
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
// LOGOUT
// ==========================================

/**
 * Logout user
 */
async function logout() {
    try {
        const supabase = window.supabaseClient;
        
        // Clear app state before logging out
        if (typeof clearAppState === 'function') {
            clearAppState();
        }
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error signing out:', error);
        }
        
        currentUser = null;
        showLogin();
        
        // Clear login form
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.value = '';
        
        showLoginMessage('', '');
        
        // Reset app initialization flag
        window.appInitialized = false;
        
    } catch (error) {
        console.error('Error during logout:', error);
    }
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

/**
 * Get current user's email
 * @returns {string|null}
 */
function getCurrentUserEmail() {
    return currentUser ? currentUser.email : null;
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
        logoutBtn.onclick = async () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                await logout();
            }
        };
    }
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.getCurrentUserEmail = getCurrentUserEmail;
window.isAuthenticated = isAuthenticated;
window.logout = logout;
window.setupLogoutListener = setupLogoutListener;
