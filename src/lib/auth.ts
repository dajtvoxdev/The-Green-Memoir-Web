/**
 * Authentication Helper Functions
 * Session cookie management using Firebase Admin SDK
 */

import { serialize, parse } from 'cookie';
import { adminAuth } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
const SESSION_COOKIE_MAX_AGE = parseInt(process.env.SESSION_COOKIE_MAX_AGE || '432000', 10); // 5 days

/**
 * Create a session cookie from a Firebase ID token
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE * 1000, // Convert to milliseconds
  });
  return sessionCookie;
}

/**
 * Verify a session cookie and return the decoded token
 */
export async function verifySessionCookie(cookie: string): Promise<DecodedIdToken | null> {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(cookie, true);
    return decodedClaims;
  } catch (error) {
    console.error('Failed to verify session cookie:', error);
    return null;
  }
}

/**
 * Create a Set-Cookie header for the session cookie
 */
export function createSessionCookieHeader(sessionCookie: string): string {
  return serialize(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Create a Set-Cookie header to clear the session cookie
 */
export function clearSessionCookieHeader(): string {
  return serialize(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Extract session cookie from request headers
 */
export function getSessionCookie(headers: { cookie?: string }): string | null {
  if (!headers.cookie) return null;
  
  const cookies = parse(headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

/**
 * Get the current user from request headers
 */
export async function getCurrentUser(headers: { cookie?: string }): Promise<DecodedIdToken | null> {
  const sessionCookie = getSessionCookie(headers);
  if (!sessionCookie) return null;
  
  return verifySessionCookie(sessionCookie);
}

/**
 * Check if user is an admin
 */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const userRecord = await adminAuth.getUser(uid);
    // Check custom claims for admin role
    return userRecord.customClaims?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Set custom claims for a user (admin only)
 */
export async function setUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}