# The Green Memoir - Web Application

Website thương mại điện tử cho game "The Green Memoir" - game nông trại 2D với văn hóa Việt Nam.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom theme)
- **Database**: Firebase Firestore + Realtime Database
- **Auth**: Firebase Auth + Session Cookies
- **Payment**: Sepay (VietQR)
- **i18n**: next-intl (Vietnamese + English)
- **Deploy**: Vercel

## Project Structure

```
web/
├── messages/                 # i18n translations
│   ├── vi.json              # Vietnamese
│   └── en.json              # English
├── public/
│   └── images/              # Static assets (logo, screenshots)
├── src/
│   ├── app/
│   │   ├── [locale]/        # Localized routes
│   │   │   ├── layout.tsx   # Root layout with fonts
│   │   │   ├── page.tsx     # Landing page (7 sections)
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Register page
│   │   │   ├── purchase/    # Payment page with QR
│   │   │   ├── download/    # Download page
│   │   │   └── profile/     # User profile
│   │   └── api/
│   │       ├── auth/        # Auth endpoints
│   │       ├── payment/     # Payment endpoints
│   │       ├── download/    # Download endpoints
│   │       └── admin/       # Admin endpoints
│   ├── components/
│   │   └── layout/          # Header, Footer
│   ├── lib/
│   │   ├── firebase-client.ts
│   │   ├── firebase-admin.ts
│   │   ├── firestore.ts
│   │   ├── auth.ts
│   │   └── sepay.ts
│   ├── i18n.ts
│   └── app/
│       ├── globals.css
│       └── layout.tsx
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/project/field-12d9d)
2. Download service account key JSON:
   - Project Settings > Service Accounts > Generate New Private Key
   - Save as `serviceAccountKey.json` in the `web/` folder
3. Enable Authentication:
   - Email/Password
   - Google Sign-In
4. Enable Firestore Database
5. Enable Realtime Database

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=field-12d9d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=field-12d9d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=field-12d9d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://field-12d9d-default-rtdb.asia-southeast1.firebasedatabase.app

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json"

# Session
SESSION_COOKIE_NAME=__session
SESSION_COOKIE_MAX_AGE=432000
SESSION_SECRET=your-secret-key-min-32-chars

# Sepay Payment
SEPAY_API_KEY=your-sepay-api-key
SEPAY_ACCOUNT_NUMBER=your-bank-account
SEPAY_BANK_CODE=VCB
SEPAY_ACCOUNT_NAME=your-account-name

# Game Price (VND)
GAME_PRICE=49000
```

### 4. Sepay Webhook Setup

Configure Sepay webhook URL:
- Production: `https://your-domain.com/api/payment/webhook`
- Development: Use ngrok for local testing

```bash
ngrok http 3000
# Set webhook URL to: https://xxxx.ngrok.io/api/payment/webhook
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
npm run build
npm start
```

## Firestore Collections

### webUsers
```typescript
{
  uid: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
  hasPurchased: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### orders
```typescript
{
  userId: string;
  userEmail: string;
  orderCode: string;  // GM-XXXXXX
  amount: number;
  status: "pending" | "paid" | "failed" | "expired";
  sepayId: number | null;
  referenceCode: string | null;
  paidAt: Timestamp | null;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}
```

### downloadTokens
```typescript
{
  userId: string;
  token: string;
  versionId: string;
  expiresAt: Timestamp;
  usedAt: Timestamp | null;
  createdAt: Timestamp;
}
```

### gameVersions
```typescript
{
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
```

### siteStats
```typescript
{
  date: string;  // "2026-03-15"
  pageViews: number;
  uniqueVisitors: number;
}
```

## API Endpoints

### Auth
| Method | Route | Mô tả | Auth |
|--------|-------|-------|------|
| POST | `/api/auth/session` | Create session cookie | Firebase token |
| DELETE | `/api/auth/session` | Logout | Session |
| GET | `/api/auth/me` | Get current user | Session |

### Payment
| Method | Route | Mô tả | Auth |
|--------|-------|-------|------|
| POST | `/api/payment/create-order` | Create new order | Session (user) |
| POST | `/api/payment/webhook` | Sepay webhook handler | Sepay API Key |
| GET | `/api/payment/check-status?orderId=x` | Check payment status | Session (user) |

### Download
| Method | Route | Mô tả | Auth |
|--------|-------|-------|------|
| POST | `/api/download/generate-token` | Generate download token | Session (purchased) |
| GET | `/api/download/[token]` | Download game file | Token in URL |

### Admin
| Method | Route | Mô tả | Auth |
|--------|-------|-------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Session (admin) |
| GET | `/api/admin/users` | List users (paginated) | Session (admin) |
| GET | `/api/admin/orders` | List orders (filtered) | Session (admin) |

## Payment Flow

1. User clicks "Mua Game" → POST `/api/payment/create-order`
2. Server creates order with unique code (GM-XXXXXX)
3. Display QR code: `https://qr.sepay.vn/img?acc=...&bank=...&amount=49000&des=GM-XXXXXX`
4. User scans QR and transfers money
5. Sepay sends webhook to `/api/payment/webhook`
6. Server verifies and updates:
   - Order status → "paid"
   - User hasPurchased → true
   - Firebase RTDB: `Users/{uid}/hasPurchased` → true
7. Frontend polls `/api/payment/check-status` every 5 seconds
8. Redirect to success page

## Security

- Session cookies (httpOnly, secure in production)
- Webhook authentication via API key
- Input validation with Zod
- Download tokens (single-use, 24h expiry)
- Admin role verification

## Deployment (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Development Status

### Phase 1: Nền tảng ✅
- [x] Next.js project setup
- [x] Firebase integration (Client + Admin)
- [x] Firestore collections + helpers
- [x] Auth flow (session cookies)
- [x] Layout components (Header, Footer)
- [x] Custom theme (Tailwind)

### Phase 2: Landing + User Pages ✅
- [x] Landing page (7 sections)
- [x] Login page
- [x] Register page
- [x] Profile page
- [x] i18n (vi/en)

### Phase 3: Thanh toán Sepay ✅
- [x] Create order API
- [x] Webhook handler
- [x] Check status API
- [x] Payment page (QR, countdown, polling)

### Phase 4: Download ✅
- [x] Token generation API
- [x] Download endpoint
- [x] Download page
- [x] Changelog display

### Phase 5: Admin + Polish 🚧
- [x] Stats API
- [x] Users API
- [x] Orders API
- [ ] Admin dashboard page
- [ ] Users management page
- [ ] Orders management page
- [ ] Versions management page
- [ ] Rate limiting
- [ ] Security hardening

## Game Integration

When payment is successful, the web app updates:
1. Firestore: `webUsers/{uid}/hasPurchased = true`
2. Realtime Database: `Users/{uid}/hasPurchased = true`

The game reads `Users/{uid}/hasPurchased` from RTDB to allow gameplay.

## License

© 2026 Moonlit Garden. All rights reserved.