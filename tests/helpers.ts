import { SignJWT } from 'jose';
import { webcrypto } from 'crypto';

const crypto = webcrypto;

// Use the same secret as the app (.env)
const TEST_JWT_SECRET = 'dev-secret-key-at-least-32-characters-long-for-testing';

async function getSigningKey(): Promise<CryptoKey> {
  const secret = new TextEncoder().encode(TEST_JWT_SECRET);
  return crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = await getSigningKey();
  }
  return cachedKey;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const key = await getKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function createUserToken(userId: string, email: string): Promise<string> {
  return createToken({ sub: userId, email, role: 'user' });
}

export async function createAdminToken(): Promise<string> {
  return createToken({ sub: 'admin', email: 'admin@events.local', role: 'admin' });
}

export async function createExpiredToken(): Promise<string> {
  const key = await getKey();
  return new SignJWT({ sub: 'user', email: 'test@test.com', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(new Date(Date.now() - 1000 * 60 * 60 * 24 * 8))
    .setExpirationTime(new Date(Date.now() - 1000 * 60 * 60 * 24))
    .sign(key);
}

export async function createTamperedToken(): Promise<string> {
  const token = await createUserToken('user', 'test@test.com');
  return token.slice(0, -5) + 'xxxxx';
}

export async function createWrongSecretToken(): Promise<string> {
  const wrongSecret = new TextEncoder().encode('wrong-secret-key-at-least-32-chars-long');
  const key = await crypto.subtle.importKey(
    'raw',
    wrongSecret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return new SignJWT({ sub: 'user', email: 'test@test.com', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

function serializeBody(body: RequestInit['body']): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  // Tests pass either plain objects or pre-stringified JSON; only stringify objects.
  if (typeof body === 'string') return body;
  if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) return body;
  return JSON.stringify(body);
}

export function createRequest(url: string, options: RequestInit = {}): Request {
  const body = serializeBody(options.body);
  return new Request(url, {
    ...options,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // `duplex` is an undici/Node extension not present in the DOM RequestInit type.
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
}

export function createAuthenticatedRequest(url: string, token: string, options: RequestInit = {}): Request {
  const body = serializeBody(options.body);
  return createRequest(url, {
    ...options,
    body,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
}

export function createCookieRequest(url: string, token: string, options: RequestInit = {}): Request {
  return createRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: `ceb_token=${token}`,
    },
  });
}