import { Prisma } from '@prisma/client';
import { normalizeCity } from '@/lib/validation';

export const publicEventWhere = (now: Date): Prisma.EventWhereInput => ({
  isActive: true,
  startsAt: { gt: now },
});

export function buildEventWhere(
  now: Date,
  filters: { category?: string; city?: string; q?: string }
): Prisma.EventWhereInput {
  const where = publicEventWhere(now);

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.city) {
    // SQLite has no case-insensitive `mode`, and stored cities are already
    // normalised, so normalise the incoming value to match them.
    where.city = normalizeCity(filters.city);
  }

  // Free-text search is handled in-memory by the service (SQLite LIKE is
  // case-sensitive and does not support Prisma's `mode: 'insensitive'`).

  return where;
}
