/**
 * Backend Server for Viajes Fran
 * Provides API endpoints for photo synchronization
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { initializeFirebase } = require('./config/firebase');
const { uploadImageWithThumbnail, getSignedUrl, deleteFile } = require('./services/storage');
const { apiLimiter, uploadLimiter, deleteLimiter } = require('./middleware/rateLimiter');
const {
    validateUserId,
    validatePhotoCreate,
    validatePhotoUpdate,
    validatePhotoDelete,
    validatePhotoUrl,
    validateBulkDelete,
    validateFileUpload
} = require('./middleware/validators');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Configure multer for file uploads (memory storage for direct upload to Firebase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet for security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable for development, enable in production
}));

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Request logging middleware (simple)
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Database setup
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'viajes-fran.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// ==========================================
// API ENDPOINTS
// ==========================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Viajes Fran API is running' });
});

/**
 * Get all photos for a user with signed URLs
 * GET /api/photos?userId=xxx
 */
app.get('/api/photos', validateUserId, async (req, res) => {
    const userId = req.query.userId;

    db.all(
        'SELECT * FROM photos WHERE user_id = ? ORDER BY createdAt DESC',
        [userId],
        async (err, rows) => {
            if (err) {
                console.error('Error fetching photos:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Generate signed URLs for photos with storage paths
            const photosWithUrls = await Promise.all(
                rows.map(async (photo) => {
                    const result = { ...photo };
                    
                    if (photo.storage_path) {
                        try {
                            result.imageUrl = await getSignedUrl(photo.storage_path);
                        } catch (error) {
                            console.error('Error generating signed URL for photo:', photo.id, error);
                        }
                    }
                    
                    if (photo.thumb_path) {
                        try {
                            result.thumbUrl = await getSignedUrl(photo.thumb_path);
                        } catch (error) {
                            console.error('Error generating signed URL for thumbnail:', photo.id, error);
                        }
                    }
                    
                    return result;
                })
            );
            
            res.json({ photos: photosWithUrls });
        }
    );
});

/**
 * Get signed URL for a specific photo
 * GET /api/photos/:id/url?userId=xxx&thumb=true
 */
app.get('/api/photos/:id/url', validatePhotoUrl, async (req, res) => {
    const photoId = req.params.id;
    const userId = req.query.userId;
    const useThumb = req.query.thumb === 'true';

    db.get(
        'SELECT storage_path, thumb_path FROM photos WHERE id = ? AND user_id = ?',
        [photoId, userId],
        async (err, row) => {
            if (err) {
                console.error('Error fetching photo:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            
            const filePath = useThumb ? row.thumb_path : row.storage_path;
            
            if (!filePath) {
                return res.status(404).json({ error: 'File not found in storage' });
            }
            
            try {
                const signedUrl = await getSignedUrl(filePath);
                res.json({ url: signedUrl });
            } catch (error) {
                console.error('Error generating signed URL:', error);
                res.status(500).json({ error: 'Error generating URL' });
            }
        }
    );
});

/**
 * Create a new photo record with file upload
 * POST /api/photos
 * Expects multipart/form-data with:
 * - file: image file
 * - userId, location, lat, lon, date, noteTitle, noteDescription, country, countryCode
 */
app.post('/api/photos', uploadLimiter, upload.single('file'), validateFileUpload, validatePhotoCreate, async (req, res) => {
    try {
        const {
            userId,
            location,
            lat,
            lon,
            date,
            noteTitle,
            noteDescription,
            country,
            countryCode
        } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        let storagePath = null;
        let thumbPath = null;
        let hasImage = false;

        // Upload file to storage if provided
        if (req.file) {
            try {
                const fileName = req.file.originalname || `photo-${Date.now()}.jpg`;
                const result = await uploadImageWithThumbnail(
                    req.file.buffer,
                    fileName,
                    userId,
                    req.file.mimetype
                );
                storagePath = result.path;
                thumbPath = result.thumbPath;
                hasImage = true;
            } catch (storageError) {
                console.error('Error uploading to storage:', storageError);
                // Continue without storage - allow photo record to be created
            }
        }

        // Insert into database
        db.run(
            `INSERT INTO photos 
             (user_id, location, lat, lon, date, noteTitle, noteDescription, country, countryCode, hasImage, storage_path, thumb_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, location, lat, lon, date, noteTitle || '', noteDescription || '', country, countryCode, hasImage, storagePath, thumbPath],
            async function(err) {
                if (err) {
                    console.error('Error inserting photo:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Generate signed URLs if storage paths exist
                let imageUrl = null;
                let thumbUrl = null;
                
                if (storagePath) {
                    try {
                        imageUrl = await getSignedUrl(storagePath);
                        if (thumbPath) {
                            thumbUrl = await getSignedUrl(thumbPath);
                        }
                    } catch (urlError) {
                        console.error('Error generating signed URLs:', urlError);
                    }
                }
                
                res.json({
                    id: this.lastID,
                    message: 'Photo record created successfully',
                    hasImage: hasImage,
                    storagePath: storagePath,
                    thumbPath: thumbPath,
                    imageUrl: imageUrl,
                    thumbUrl: thumbUrl
                });
            }
        );
    } catch (error) {
        console.error('Error in POST /api/photos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update a photo record
 * PUT /api/photos/:id
 */
app.put('/api/photos/:id', validatePhotoUpdate, (req, res) => {
    const photoId = req.params.id;
    const {
        userId,
        location,
        lat,
        lon,
        date,
        noteTitle,
        noteDescription,
        country,
        countryCode
    } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    db.run(
        `UPDATE photos 
         SET location = ?, lat = ?, lon = ?, date = ?, 
             noteTitle = ?, noteDescription = ?, country = ?, countryCode = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [location, lat, lon, date, noteTitle || '', noteDescription || '', country, countryCode, photoId, userId],
        function(err) {
            if (err) {
                console.error('Error updating photo:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            
            res.json({ message: 'Photo updated successfully' });
        }
    );
});

/**
 * Delete a photo record and its files from storage
 * DELETE /api/photos/:id?userId=xxx
 */
app.delete('/api/photos/:id', deleteLimiter, validatePhotoDelete, async (req, res) => {
    const photoId = req.params.id;
    const userId = req.query.userId;

    // First, get storage paths before deleting
    db.get(
        'SELECT storage_path, thumb_path FROM photos WHERE id = ? AND user_id = ?',
        [photoId, userId],
        async (err, row) => {
            if (err) {
                console.error('Error fetching photo:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Photo not found' });
            }
            
            // Delete files from storage
            if (row.storage_path) {
                await deleteFile(row.storage_path);
            }
            if (row.thumb_path) {
                await deleteFile(row.thumb_path);
            }
            
            // Delete from database
            db.run(
                'DELETE FROM photos WHERE id = ? AND user_id = ?',
                [photoId, userId],
                function(deleteErr) {
                    if (deleteErr) {
                        console.error('Error deleting photo:', deleteErr);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Photo not found' });
                    }
                    
                    res.json({ message: 'Photo deleted successfully' });
                }
            );
        }
    );
});

/**
 * Delete all photos for a user and their files from storage
 * DELETE /api/photos?userId=xxx&all=true
 */
app.delete('/api/photos', deleteLimiter, validateBulkDelete, async (req, res) => {
    const userId = req.query.userId;

    // First, get all storage paths before deleting
    db.all(
        'SELECT storage_path, thumb_path FROM photos WHERE user_id = ?',
        [userId],
        async (err, rows) => {
            if (err) {
                console.error('Error fetching photos:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Delete all files from storage
            for (const row of rows) {
                if (row.storage_path) {
                    await deleteFile(row.storage_path);
                }
                if (row.thumb_path) {
                    await deleteFile(row.thumb_path);
                }
            }
            
            // Delete from database
            db.run(
                'DELETE FROM photos WHERE user_id = ?',
                [userId],
                function(deleteErr) {
                    if (deleteErr) {
                        console.error('Error deleting photos:', deleteErr);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
                    res.json({ 
                        message: `Deleted ${this.changes} photos successfully`,
                        count: this.changes
                    });
                }
            );
        }
    );
});

// ==========================================
// SERVER STARTUP
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📸 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database closed');
        }
        process.exit(0);
    });
});

