/**
 * ==========================================
 * REQUEST VALIDATORS
 * ==========================================
 * Validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

/**
 * Validate userId parameter
 */
const validateUserId = [
    query('userId')
        .notEmpty().withMessage('userId is required')
        .isString().withMessage('userId must be a string')
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('userId must be between 1 and 100 characters'),
    handleValidationErrors
];

/**
 * Validate photo creation data
 */
const validatePhotoCreate = [
    body('userId')
        .notEmpty().withMessage('userId is required')
        .isString().withMessage('userId must be a string')
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('userId must be between 1 and 100 characters'),
    body('location')
        .optional()
        .isString().withMessage('location must be a string')
        .trim()
        .isLength({ max: 500 }).withMessage('location must be less than 500 characters'),
    body('lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
    body('lon')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('lon must be between -180 and 180'),
    body('date')
        .optional()
        .isString().withMessage('date must be a string')
        .trim(),
    body('noteTitle')
        .optional()
        .isString().withMessage('noteTitle must be a string')
        .trim()
        .isLength({ max: 200 }).withMessage('noteTitle must be less than 200 characters'),
    body('noteDescription')
        .optional()
        .isString().withMessage('noteDescription must be a string')
        .trim()
        .isLength({ max: 1000 }).withMessage('noteDescription must be less than 1000 characters'),
    body('country')
        .optional()
        .isString().withMessage('country must be a string')
        .trim()
        .isLength({ max: 100 }).withMessage('country must be less than 100 characters'),
    body('countryCode')
        .optional()
        .isString().withMessage('countryCode must be a string')
        .trim()
        .isLength({ min: 2, max: 2 }).withMessage('countryCode must be exactly 2 characters')
        .matches(/^[A-Z]{2}$/).withMessage('countryCode must be 2 uppercase letters'),
    handleValidationErrors
];

/**
 * Validate photo update data
 */
const validatePhotoUpdate = [
    param('id')
        .notEmpty().withMessage('Photo ID is required')
        .isInt({ min: 1 }).withMessage('Photo ID must be a positive integer'),
    ...validatePhotoCreate
];

/**
 * Validate photo deletion
 */
const validatePhotoDelete = [
    param('id')
        .notEmpty().withMessage('Photo ID is required')
        .isInt({ min: 1 }).withMessage('Photo ID must be a positive integer'),
    ...validateUserId
];

/**
 * Validate photo URL request
 */
const validatePhotoUrl = [
    param('id')
        .notEmpty().withMessage('Photo ID is required')
        .isInt({ min: 1 }).withMessage('Photo ID must be a positive integer'),
    query('userId')
        .notEmpty().withMessage('userId is required')
        .isString().withMessage('userId must be a string')
        .trim(),
    query('thumb')
        .optional()
        .isIn(['true', 'false']).withMessage('thumb must be true or false'),
    handleValidationErrors
];

/**
 * Validate bulk delete request
 */
const validateBulkDelete = [
    query('userId')
        .notEmpty().withMessage('userId is required')
        .isString().withMessage('userId must be a string')
        .trim(),
    query('all')
        .equals('true').withMessage('all must be true for bulk deletion'),
    handleValidationErrors
];

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    if (!filename) return `photo-${Date.now()}.jpg`;
    
    // Remove path traversal attempts
    const basename = filename.replace(/^.*[\\\/]/, '');
    
    // Allow only alphanumeric, dash, underscore, and period
    const safe = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Limit length
    const maxLength = 255;
    return safe.length > maxLength ? safe.substring(0, maxLength) : safe;
}

/**
 * Validate file upload
 */
function validateFileUpload(req, res, next) {
    if (!req.file) {
        // File is optional, but if provided, must be valid
        return next();
    }
    
    const file = req.file;
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return res.status(400).json({ 
            error: 'File too large',
            message: 'Maximum file size is 10MB'
        });
    }
    
    // Check MIME type
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
            error: 'Invalid file type',
            message: 'Only JPEG, PNG, WebP, and GIF images are allowed'
        });
    }
    
    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);
    
    next();
}

module.exports = {
    validateUserId,
    validatePhotoCreate,
    validatePhotoUpdate,
    validatePhotoDelete,
    validatePhotoUrl,
    validateBulkDelete,
    validateFileUpload,
    sanitizeFilename
};

