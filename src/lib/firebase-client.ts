/**
 * Firebase Client SDK Configuration
 * Used for browser-side authentication
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase lazily (browser-only for auth/rtdb)
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// Lazy getters to avoid calling getAuth() on the server
// where localStorage is not available
let _auth: Auth | null = null;
let _rtdb: Database | null = null;

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

export function getFirebaseRtdb(): Database {
  if (!_rtdb) {
    _rtdb = getDatabase(getFirebaseApp());
  }
  return _rtdb;
}

// Backward-compatible exports (use inside useEffect or event handlers only)
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : (null as unknown as Auth);
export const rtdb = typeof window !== 'undefined' ? getFirebaseRtdb() : (null as unknown as Database);

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

export default getFirebaseApp;