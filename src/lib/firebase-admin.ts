/**
 * Firebase Admin SDK Configuration
 * Used for server-side operations (Auth, Firestore, Realtime Database)
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

    // Priority 1: JSON string from env var (Vercel deployment)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
      });
    }
    // Priority 2: File path (local development)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const filePath = resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (existsSync(filePath)) {
        const serviceAccount = JSON.parse(readFileSync(filePath, 'utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL,
        });
      } else {
        console.warn('Service account file not found:', filePath);
        admin.initializeApp({ databaseURL });
      }
    }
    // Priority 3: Application default credentials (GCP environments)
    else {
      admin.initializeApp({ databaseURL });
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