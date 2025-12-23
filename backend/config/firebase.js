/**
 * Firebase Admin SDK Configuration
 * Initialize Firebase Admin for Storage access
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// You can use either service account key file or environment variables
let firebaseInitialized = false;

function initializeFirebase() {
    if (firebaseInitialized) {
        return admin;
    }

    try {
        // Option 1: Use service account key file
        // Place your serviceAccountKey.json in the config folder
        const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
        const fs = require('fs');
        
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.projectId + '.appspot.com'
            });
            firebaseInitialized = true;
            console.log('✅ Firebase Admin initialized with service account');
            return admin;
        }

        // Option 2: Use environment variables
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                }),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_PROJECT_ID + '.appspot.com'
            });
            firebaseInitialized = true;
            console.log('✅ Firebase Admin initialized with environment variables');
            return admin;
        }

        console.warn('⚠️ Firebase not configured. Storage features will be disabled.');
        console.warn('   To enable: Add serviceAccountKey.json or set environment variables');
        return null;
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        return null;
    }
}

module.exports = {
    initializeFirebase,
    getAdmin: () => firebaseInitialized ? admin : null
};

