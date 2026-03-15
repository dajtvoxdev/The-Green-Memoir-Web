/**
 * Firebase Admin SDK Configuration
 * Used for server-side operations (Auth, Firestore, Realtime Database)
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  if (admin.apps.length === 0) {
    // Try to initialize with service account key
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } else {
      // Fallback to application default credentials (for Vercel/GCP)
      admin.initializeApp({
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    }
  }
  return admin;
}

const adminApp = initFirebaseAdmin();

// Export Firebase Admin services
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
export const adminRtdb = adminApp.database();

// Firestore collection names
export const COLLECTIONS = {
  WEB_USERS: 'webUsers',
  ORDERS: 'orders',
  DOWNLOAD_TOKENS: 'downloadTokens',
  GAME_VERSIONS: 'gameVersions',
  SITE_STATS: 'siteStats',
} as const;

// RTDB paths (same as client)
export const RTDB_PATHS = {
  USER: (uid: string) => `Users/${uid}`,
  USER_HAS_PURCHASED: (uid: string) => `Users/${uid}/hasPurchased`,
} as const;

// User roles
export type UserRole = 'user' | 'admin';

export default adminApp;