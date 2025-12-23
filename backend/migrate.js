/**
 * Database Migration Script
 * Creates the photos table if it doesn't exist
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'viajes-fran.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Create photos table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            location TEXT,
            lat REAL,
            lon REAL,
            date TEXT,
            noteTitle TEXT,
            noteDescription TEXT,
            country TEXT,
            countryCode TEXT,
            hasImage BOOLEAN DEFAULT 0,
            storage_path TEXT,
            thumb_path TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            process.exit(1);
        }
        console.log('✅ Photos table created/verified');
    });

    // Create index on user_id for faster queries
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_user_id ON photos(user_id)
    `, (err) => {
        if (err) {
            console.error('Error creating index:', err);
        } else {
            console.log('✅ Index created on user_id');
        }
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        console.log('✅ Migration completed successfully');
        process.exit(0);
    });
});

