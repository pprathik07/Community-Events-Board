import { getSessionFromRequest, type JWTPayload } from './jwt';

/**
 * Session guards for route handlers.
 *
 * These distinguish "not authenticated" (401) from "authenticated but the
 * wrong role" (403), which the authorization-matrix tests rely on.
 */

export async function requireUserSession(req: Request): Promise<JWTPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) throw new Error('UNAUTHENTICATED');
  if (session.role !== 'user') throw new Error('FORBIDDEN');
  return session;
}

export async function requireAdminSession(req: Request): Promise<JWTPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) throw new Error('UNAUTHENTICATED');
  if (session.role !== 'admin') throw new Error('FORBIDDEN');
  return session;
}
