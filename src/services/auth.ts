import { prisma } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { env } from '@/lib/env';
import { HttpError } from '@/lib/http';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison (EC-A16).
 * Both sides are hashed with SHA-256 first so that inputs of differing length
 * can be compared without leaking length information through the compare.
 */
function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const hashA = createHash('sha256').update(a, 'utf8').digest();
  const hashB = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(hashA, hashB);
}


export async function signup(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Email already registered');
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  const token = await signToken({ sub: user.id, email: user.email, role: 'user' });
  return { token, user: { id: user.id, email: user.email, role: 'user' as const } };
}

export async function login(email: string, password: string) {
  const isAdmin = safeEqual(email, env.ADMIN_EMAIL) && safeEqual(password, env.ADMIN_PASSWORD);

  if (isAdmin) {
    const token = await signToken({ sub: 'admin', email: env.ADMIN_EMAIL, role: 'admin' });
    return { token, user: { id: 'admin', email: env.ADMIN_EMAIL, role: 'admin' as const } };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = await signToken({ sub: user.id, email: user.email, role: 'user' });
  return { token, user: { id: user.id, email: user.email, role: 'user' as const } };
}

export async function getUser(id: string) {
  if (id === 'admin') return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, createdAt: true } });
}