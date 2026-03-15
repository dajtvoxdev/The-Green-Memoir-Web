
/**
 * Firebase Client SDK Configuration
 * Used for browser-side authentication
 *
 * All Firebase imports are dynamic to prevent server-side localStorage crashes.
 * Node.js 22+ exposes a broken localStorage global (via --localstorage-file),
 * and firebase/auth's module init accesses it immediately on import.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _rtdb: Database | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!_app) {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (!_auth) {
    const app = await getFirebaseApp();
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(app);
  }
  return _auth;
}

export async function getFirebaseRtdb(): Promise<Database> {
  if (!_rtdb) {
    const app = await getFirebaseApp();
    const { getDatabase } = await import('firebase/database');
    _rtdb = getDatabase(app);
  }
  return _rtdb;
}

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
