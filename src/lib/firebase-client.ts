/**
 * Firebase Client SDK Configuration
 * Used for browser-side authentication
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
function initFirebase() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = initFirebase();

// Export Firebase services
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// For game data - Realtime Database paths
export const RTDB_PATHS = {
  USER: (uid: string) => `Users/${uid}`,
  USER_HAS_PURCHASED: (uid: string) => `Users/${uid}/hasPurchased`,
  USER_GOLD: (uid: string) => `Users/${uid}/Gold`,
  USER_DIAMOND: (uid: string) => `Users/${uid}/Diamond`,
  USER_NAME: (uid: string) => `Users/${uid}/Name`,
  USER_MAP_IN_GAME: (uid: string) => `Users/${uid}/MapInGame`,
  USER_VERSION: (uid: string) => `Users/${uid}/Version`,
};

export default app;