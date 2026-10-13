import { env } from './env';

const COOKIE_NAME = 'ceb_token';

export function createAuthCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; ${isProd ? 'Secure; ' : ''}Path=/; Max-Age=${60 * 60 * 24 * 7}`;
}

export function createClearCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; ${isProd ? 'Secure; ' : ''}Path=/; Max-Age=0`;
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// Async versions for use in route handlers
export async function setAuthCookie(token: string): Promise<string> {
  return createAuthCookie(token);
}

export async function clearAuthCookie(): Promise<string> {
  return createClearCookie();
}