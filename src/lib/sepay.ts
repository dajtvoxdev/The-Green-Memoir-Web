/**
 * Sepay Payment Integration
 * QR Code generation and webhook verification
 */

import { z } from 'zod';

// Sepay configuration
const SEPAY_CONFIG = {
  BASE_URL: 'https://qr.sepay.vn',
  IMG_URL: 'https://qr.sepay.vn/img',
  BANKS_URL: 'https://qr.sepay.vn/banks.json',
  API_KEY: process.env.SEPAY_API_KEY || '',
  ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER || '',
  BANK_CODE: process.env.SEPAY_BANK_CODE || 'VCB',
};

// Order status enum
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';

// Generate unique order code (format: GMXXXXXX — no special characters for bank transfer content)
export function generateOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude I, O, 0, 1 for readability
  let result = 'GM';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Build QR Code URL for VietQR
export function buildQRUrl(params: {
  accountNumber: string;
  bankCode: string;
  amount: number;
  orderCode: string;
  accountName?: string;
}): string {
  const { accountNumber, bankCode, amount, orderCode, accountName } = params;
  
  // Build query parameters according to VietQR standard
  const queryParams = new URLSearchParams();
  queryParams.set('acc', accountNumber);
  queryParams.set('bank', bankCode);
  queryParams.set('amount', amount.toString());
  queryParams.set('des', orderCode); // Order code as description
  
  if (accountName) {
    queryParams.set('ac', accountName);
  }
  
  return `${SEPAY_CONFIG.IMG_URL}?${queryParams.toString()}`;
}

// Zod schema for Sepay webhook payload
export const sepayWebhookSchema = z.object({
  id: z.number(), // Unique transaction ID for deduplication
  gateway: z.string(), // Bank name (e.g., "Vietcombank")
  transactionDate: z.string(), // Format: "2023-03-25 14:02:37"
  accountNumber: z.string(),
  code: z.string().nullable(), // Payment code if Sepay detected it
  content: z.string(), // Transfer content - contains orderCode
  transferType: z.string(), // "in" for incoming, "out" for outgoing
  transferAmount: z.number(),
  accumulated: z.number(),
  subAccount: z.string().nullable(),
  referenceCode: z.string().nullable(), // Bank reference code
  description: z.string(),
});

export type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>;

// Verify Sepay webhook request
export function verifySepayWebhook(headers: { authorization?: string }): boolean {
  const authHeader = headers.authorization;
  
  if (!authHeader) {
    return false;
  }
  
  // Expected format: "Apikey <SEPAY_API_KEY>"
  const expectedAuth = `Apikey ${SEPAY_CONFIG.API_KEY}`;
  return authHeader === expectedAuth;
}

// Parse order code from webhook content
export function parseOrderCode(content: string): string | null {
  // Look for pattern GMXXXXXX in the content (also supports legacy GM-XXXXXX)
  const match = content.match(/GM-?[A-Z0-9]{6}/i);
  return match ? match[0].toUpperCase() : null;
}

// Validate webhook payload
export function validateWebhookPayload(data: unknown): { valid: boolean; payload?: SepayWebhookPayload; error?: string } {
  try {
    const payload = sepayWebhookSchema.parse(data);
    
    // Additional validation
    if (payload.transferType !== 'in') {
      return { valid: false, error: 'Only incoming transfers are accepted' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      return { valid: false, error: messages.join(', ') };
    }
    return { valid: false, error: 'Invalid payload format' };
  }
}

// Get list of supported banks (for reference)
export async function getSupportedBanks(): Promise<Array<{
  code: string;
  name: string;
  shortName: string;
}>> {
  try {
    const response = await fetch(SEPAY_CONFIG.BANKS_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch banks');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
}

// Calculate order expiration time (30 minutes from now)
export function getOrderExpirationDate(): Date {
  return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
}

// Check if order has expired
export function isOrderExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}