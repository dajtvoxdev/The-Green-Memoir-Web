/**
 * Firestore Helper Functions
 * CRUD operations for all collections
 */

import { adminDb, COLLECTIONS } from './firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { UserRole } from './firebase-admin';

// ==================== Types ====================

export interface WebUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  hasPurchased: boolean;
  disabled?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  orderCode: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  sepayId: number | null;
  referenceCode: string | null;
  paidAt: Timestamp | null;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface DownloadToken {
  id?: string;
  userId: string;
  token: string;
  versionId: string;
  expiresAt: Timestamp;
  usedAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface GameVersion {
  id?: string;
  versionNumber: string;
  displayName: string;
  changelog: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  isLatest: boolean;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface SiteStats {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

// ==================== Web Users ====================

export async function createWebUser(data: Omit<WebUser, 'createdAt' | 'updatedAt'>): Promise<WebUser> {
  const now = Timestamp.now();
  const userData: WebUser = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  await adminDb.collection(COLLECTIONS.WEB_USERS).doc(data.uid).set(userData);
  return userData;
}

export async function getWebUser(uid: string): Promise<WebUser | null> {
  const doc = await adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() } as WebUser;
}

export async function updateWebUser(uid: string, data: Partial<WebUser>): Promise<void> {
  await adminDb.collection(COLLECTIONS.WEB_USERS).doc(uid).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function updateUserPurchaseStatus(uid: string, hasPurchased: boolean): Promise<void> {
  await updateWebUser(uid, { hasPurchased });
}

export async function listWebUsers(limit: number = 20, offset: number = 0): Promise<WebUser[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.WEB_USERS)
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as WebUser);
}

// ==================== Orders ====================

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const orderData: Order = {
    ...data,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await adminDb.collection(COLLECTIONS.ORDERS).add(orderData);
  return { id: docRef.id, ...orderData };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const doc = await adminDb.collection(COLLECTIONS.ORDERS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Order;
}

export async function getOrderByCode(orderCode: string): Promise<Order | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.ORDERS)
    .where('orderCode', '==', orderCode)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Order;
}

export async function getOrdersByUserId(userId: string, limit: number = 20): Promise<Order[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.ORDERS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

export async function getOrdersByStatus(status: Order['status'], limit: number = 50): Promise<Order[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.ORDERS)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<void> {
  await adminDb.collection(COLLECTIONS.ORDERS).doc(id).update(data);
}

export async function markOrderAsPaid(orderId: string, sepayId: number, referenceCode: string | null): Promise<void> {
  await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).update({
    status: 'paid',
    sepayId,
    referenceCode,
    paidAt: Timestamp.now(),
  });
}

export async function markOrderAsExpired(id: string): Promise<void> {
  await adminDb.collection(COLLECTIONS.ORDERS).doc(id).update({
    status: 'expired',
  });
}

export async function listOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.ORDERS)
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

// ==================== Download Tokens ====================

export async function createDownloadToken(data: Omit<DownloadToken, 'id' | 'createdAt' | 'usedAt'>): Promise<DownloadToken> {
  const tokenData: DownloadToken = {
    ...data,
    usedAt: null,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await adminDb.collection(COLLECTIONS.DOWNLOAD_TOKENS).add(tokenData);
  return { id: docRef.id, ...tokenData };
}

export async function getDownloadToken(token: string): Promise<DownloadToken | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.DOWNLOAD_TOKENS)
    .where('token', '==', token)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DownloadToken;
}

export async function markTokenAsUsed(id: string): Promise<void> {
  await adminDb.collection(COLLECTIONS.DOWNLOAD_TOKENS).doc(id).update({
    usedAt: Timestamp.now(),
  });
}

// ==================== Game Versions ====================

export async function createGameVersion(data: Omit<GameVersion, 'id' | 'createdAt'>): Promise<GameVersion> {
  const versionData: GameVersion = {
    ...data,
    createdAt: Timestamp.now(),
  };
  
  // If this is the latest version, mark all others as not latest
  if (data.isLatest) {
    const latestVersions = await adminDb.collection(COLLECTIONS.GAME_VERSIONS)
      .where('isLatest', '==', true)
      .get();
    
    const batch = adminDb.batch();
    latestVersions.forEach(doc => {
      batch.update(doc.ref, { isLatest: false });
    });
    await batch.commit();
  }
  
  const docRef = await adminDb.collection(COLLECTIONS.GAME_VERSIONS).add(versionData);
  return { id: docRef.id, ...versionData };
}

export async function getGameVersion(id: string): Promise<GameVersion | null> {
  const doc = await adminDb.collection(COLLECTIONS.GAME_VERSIONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as GameVersion;
}

export async function getLatestGameVersion(): Promise<GameVersion | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.GAME_VERSIONS)
    .where('isLatest', '==', true)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as GameVersion;
}

export async function getActiveGameVersions(): Promise<GameVersion[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.GAME_VERSIONS)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GameVersion);
}

export async function updateGameVersion(id: string, data: Partial<GameVersion>): Promise<void> {
  await adminDb.collection(COLLECTIONS.GAME_VERSIONS).doc(id).update(data);
}

export async function listGameVersions(limit: number = 50): Promise<GameVersion[]> {
  const snapshot = await adminDb.collection(COLLECTIONS.GAME_VERSIONS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GameVersion);
}

// ==================== Site Stats ====================

export async function getSiteStats(date: string): Promise<SiteStats | null> {
  const doc = await adminDb.collection(COLLECTIONS.SITE_STATS).doc(date).get();
  if (!doc.exists) return null;
  return { date: doc.id, ...doc.data() } as SiteStats;
}

export async function createOrUpdateSiteStats(date: string, pageViews: number, uniqueVisitors: number): Promise<SiteStats> {
  const statsData: SiteStats = { date, pageViews, uniqueVisitors };
  await adminDb.collection(COLLECTIONS.SITE_STATS).doc(date).set(statsData, { merge: true });
  return statsData;
}

export async function incrementPageViews(date: string): Promise<number> {
  const docRef = adminDb.collection(COLLECTIONS.SITE_STATS).doc(date);
  await docRef.set({ pageViews: FieldValue.increment(1) }, { merge: true });
  
  const doc = await docRef.get();
  return (doc.data()?.pageViews || 0) as number;
}
