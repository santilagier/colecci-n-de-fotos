/**
 * Storage Service
 * Handles file uploads to Firebase Storage and URL generation
 */

const { getAdmin } = require('../config/firebase');
const sharp = require('sharp');
const path = require('path');

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || null;

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} userId - User ID
 * @param {string} mimeType - MIME type
 * @returns {Promise<{path: string, url: string}>}
 */
async function uploadFile(fileBuffer, fileName, userId, mimeType = 'image/jpeg') {
    const admin = getAdmin();
    if (!admin || !BUCKET_NAME) {
        throw new Error('Firebase Storage not configured');
    }

    const bucket = admin.storage().bucket(BUCKET_NAME);
    
    // Generate unique file path: photos/{userId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `photos/${userId}/${timestamp}-${sanitizedFileName}`;
    
    const file = bucket.file(filePath);
    
    // Upload file
    await file.save(fileBuffer, {
        metadata: {
            contentType: mimeType,
            metadata: {
                userId: userId,
                uploadedAt: new Date().toISOString()
            }
        },
        public: false // Private bucket
    });

    return {
        path: filePath,
        url: null // Will be generated via signed URL
    };
}

/**
 * Generate thumbnail from image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} width - Thumbnail width (default: 300)
 * @returns {Promise<Buffer>} Thumbnail buffer
 */
async function generateThumbnail(imageBuffer, width = 300) {
    try {
        const thumbnail = await sharp(imageBuffer)
            .resize(width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        
        return thumbnail;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        throw error;
    }
}

/**
 * Upload image with thumbnail
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} fileName - File name
 * @param {string} userId - User ID
 * @param {string} mimeType - MIME type
 * @returns {Promise<{path: string, thumbPath: string}>}
 */
async function uploadImageWithThumbnail(imageBuffer, fileName, userId, mimeType = 'image/jpeg') {
    // Upload original image
    const originalResult = await uploadFile(imageBuffer, fileName, userId, mimeType);
    
    // Generate and upload thumbnail
    const thumbnailBuffer = await generateThumbnail(imageBuffer);
    const thumbFileName = `thumb-${fileName}`;
    const thumbResult = await uploadFile(thumbnailBuffer, thumbFileName, userId, mimeType);
    
    return {
        path: originalResult.path,
        thumbPath: thumbResult.path
    };
}

/**
 * Generate signed URL for private file
 * @param {string} filePath - Storage path
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
    const admin = getAdmin();
    if (!admin || !BUCKET_NAME) {
        throw new Error('Firebase Storage not configured');
    }

    const bucket = admin.storage().bucket(BUCKET_NAME);
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000
    });
    
    return url;
}

/**
 * Delete file from storage
 * @param {string} filePath - Storage path
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
    const admin = getAdmin();
    if (!admin || !BUCKET_NAME) {
        return; // Silently fail if storage not configured
    }

    try {
        const bucket = admin.storage().bucket(BUCKET_NAME);
        const file = bucket.file(filePath);
        await file.delete();
    } catch (error) {
        console.error('Error deleting file from storage:', error);
        // Don't throw - allow deletion to continue even if storage delete fails
    }
}

module.exports = {
    uploadFile,
    uploadImageWithThumbnail,
    getSignedUrl,
    deleteFile,
    generateThumbnail
};

