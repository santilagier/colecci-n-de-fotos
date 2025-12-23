/**
 * ==========================================
 * RATE LIMITING MIDDLEWARE
 * ==========================================
 * Protect API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false // Disable X-RateLimit-* headers
});

/**
 * Upload rate limiter
 * 20 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        error: 'Too many uploads',
        message: 'Maximum 20 uploads per hour. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Delete rate limiter
 * 50 deletes per hour
 */
const deleteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 deletes per hour
    message: {
        error: 'Too many delete requests',
        message: 'Maximum 50 deletes per hour. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    apiLimiter,
    uploadLimiter,
    deleteLimiter
};

