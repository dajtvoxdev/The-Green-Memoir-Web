import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GAME_PRICE = 49000;
const DEFAULT_COUNT = 20;
const ORDER_STATUSES = [
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'paid',
  'pending',
  'pending',
  'pending',
  'pending',
  'failed',
  'failed',
  'expired',
  'expired',
];

const FAKE_CUSTOMERS = [
  { displayName: 'Nguyen Minh Anh', email: 'minh.anh.nguyen@gmail.com' },
  { displayName: 'Tran Gia Huy', email: 'giahuy.tran@outlook.com' },
  { displayName: 'Le Bao Chau', email: 'bao.chau.le@gmail.com' },
  { displayName: 'Pham Quynh Nhu', email: 'quynhnhu.pham@gmail.com' },
  { displayName: 'Vo Hoang Long', email: 'hoanglong.vo@yahoo.com' },
  { displayName: 'Dang Thu Ha', email: 'thuha.dang@gmail.com' },
  { displayName: 'Bui Duc Manh', email: 'ducmanh.bui@gmail.com' },
  { displayName: 'Do Khanh Linh', email: 'khanhlinh.do@icloud.com' },
  { displayName: 'Phan Tuan Kiet', email: 'tuankiet.phan@gmail.com' },
  { displayName: 'Huynh My Tien', email: 'mytien.huynh@gmail.com' },
  { displayName: 'Ngo Thanh Dat', email: 'thanhdat.ngo@gmail.com' },
  { displayName: 'Cao Nhat Vy', email: 'nhatvy.cao@outlook.com' },
  { displayName: 'Duong Gia Bao', email: 'giabao.duong@gmail.com' },
  { displayName: 'Truong Kim Ngan', email: 'kimngan.truong@gmail.com' },
  { displayName: 'Mai Quoc Bao', email: 'quocbao.mai@gmail.com' },
  { displayName: 'Lam Thao Nguyen', email: 'thaonguyen.lam@gmail.com' },
  { displayName: 'Vu Tien Phat', email: 'tienphat.vu@yahoo.com' },
  { displayName: 'Hoang Anh Thu', email: 'anhthu.hoang@gmail.com' },
  { displayName: 'Ton That Minh Tri', email: 'minhtri.tonthat@gmail.com' },
  { displayName: 'Nguyen Bao Tram', email: 'baotram.nguyen@icloud.com' },
];

function loadEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) {
    return env;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const delimiter = line.indexOf('=');
    if (delimiter === -1) {
      continue;
    }
    const key = line.slice(0, delimiter).trim();
    let value = line.slice(delimiter + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function getStatusForIndex(index) {
  return ORDER_STATUSES[index % ORDER_STATUSES.length];
}

function buildFakeCustomer(index) {
  const base = FAKE_CUSTOMERS[index % FAKE_CUSTOMERS.length];
  const cycle = Math.floor(index / FAKE_CUSTOMERS.length);
  if (cycle === 0) {
    return base;
  }

  const [localPart, domain] = base.email.split('@');
  return {
    displayName: `${base.displayName} ${cycle + 1}`,
    email: `${localPart}+${cycle + 1}@${domain}`,
  };
}

function generateOrderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'GM';
  for (let index = 0; index < 6; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildReferenceCode(batchLabel, index, createdAt) {
  const compactDate = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `FT${compactDate}${batchLabel.slice(-4)}${String(index + 1).padStart(3, '0')}`;
}

function buildSeedTimeline(status, now, index) {
  const baseCreatedAt = new Date(now);

  if (status === 'paid') {
    baseCreatedAt.setDate(baseCreatedAt.getDate() - (index % 12));
    baseCreatedAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    const paidAt = new Date(baseCreatedAt.getTime() + (4 + (index % 11)) * 60 * 1000);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt, expiresAt };
  }

  if (status === 'pending') {
    baseCreatedAt.setHours(baseCreatedAt.getHours() - (index % 5), 5 + (index * 9) % 60, 0, 0);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
  }

  if (status === 'failed') {
    baseCreatedAt.setDate(baseCreatedAt.getDate() - (2 + (index % 6)));
    baseCreatedAt.setHours(18 + (index % 4), 10 + (index * 5) % 45, 0, 0);
    const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
    return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
  }

  baseCreatedAt.setDate(baseCreatedAt.getDate() - (1 + (index % 4)));
  baseCreatedAt.setHours(7 + (index % 5), 15 + (index * 3) % 40, 0, 0);
  const expiresAt = new Date(baseCreatedAt.getTime() + 30 * 60 * 1000);
  return { createdAt: baseCreatedAt, paidAt: null, expiresAt };
}

async function main() {
  const workdir = process.cwd();
  const env = {
    ...loadEnvFile(resolve(workdir, '.env')),
    ...process.env,
  };

  const countArg = process.argv[2];
  const count = countArg ? parseInt(countArg, 10) : DEFAULT_COUNT;
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error('Count must be an integer between 1 and 100.');
  }

  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolve(workdir, env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : resolve(workdir, 'serviceAccountKey.json');

  if (!existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  const databaseURL = env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(databaseURL ? { databaseURL } : {}),
    });
  }

  const firestore = admin.firestore();
  firestore.settings({ preferRest: true });
  const rtdb = databaseURL ? admin.database() : null;
  const now = new Date();
  const batchLabel = `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const batch = firestore.batch();
  const rtdbPayload = {};
  const summary = {
    total: count,
    paid: 0,
    pending: 0,
    failed: 0,
    expired: 0,
    amountPerOrder: GAME_PRICE,
    totalRevenue: 0,
  };

  for (let index = 0; index < count; index += 1) {
    const status = getStatusForIndex(index);
    const customer = buildFakeCustomer(index);
    const userId = `seed-${batchLabel.toLowerCase()}-${String(index + 1).padStart(3, '0')}`;
    const userRef = firestore.collection('webUsers').doc(userId);
    const orderRef = firestore.collection('orders').doc();
    const timeline = buildSeedTimeline(status, now, index);
    const createdAt = admin.firestore.Timestamp.fromDate(timeline.createdAt);
    const paidAt = timeline.paidAt ? admin.firestore.Timestamp.fromDate(timeline.paidAt) : null;
    const expiresAt = admin.firestore.Timestamp.fromDate(timeline.expiresAt);
    const hasPurchased = status === 'paid';

    summary[status] += 1;
    if (hasPurchased) {
      summary.totalRevenue += GAME_PRICE;
    }

    batch.set(userRef, {
      email: customer.email,
      displayName: customer.displayName,
      role: 'user',
      hasPurchased,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(timeline.createdAt.getTime() - (index % 7 + 1) * 24 * 60 * 60 * 1000)),
      updatedAt: paidAt || createdAt,
    });

    batch.set(orderRef, {
      userId,
      userEmail: customer.email,
      orderCode: generateOrderCode(),
      amount: GAME_PRICE,
      status,
      sepayId: hasPurchased ? 8200000 + index * 17 + Math.floor(now.getTime() % 1000) : null,
      referenceCode: hasPurchased ? buildReferenceCode(batchLabel, index, timeline.createdAt) : null,
      paidAt,
      expiresAt,
      createdAt,
    });

    rtdbPayload[`Users/${userId}/hasPurchased`] = hasPurchased;
  }

  await batch.commit();
  if (rtdb && Object.keys(rtdbPayload).length > 0) {
    await rtdb.ref().update(rtdbPayload);
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        batchLabel,
        summary,
        syncedRtdb: Boolean(rtdb),
      },
      null,
      2,
    ),
  );

  await admin.app().delete();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
