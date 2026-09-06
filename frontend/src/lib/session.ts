import type { AuthSession } from '@/types';

/**
 * Session-token verification shared by the edge middleware and the
 * /api/v1/auth/me route handler. Token format is base64url(payload).hmac_hex
 * (HMAC-SHA256), signed by the FastAPI backend under LANDSIGHT_AUTH_SECRET.
 */

const AUTH_SECRET = process.env.LANDSIGHT_AUTH_SECRET || 'landsight-dev-2026';

function b64urlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function verifySessionToken(token: string | undefined | null): Promise<AuthSession | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, signature] = parts;

  try {
    const key = await getHmacKey();
    const computed = bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
    if (!timingSafeEqualHex(computed, signature)) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as AuthSession;
    if (!payload.role || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}