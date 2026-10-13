import { z } from 'zod';
import { CATEGORIES, CARD_THEMES, STICKERS } from './constants';

const categoryEnum = z.enum(CATEGORIES);
const themeEnum = z.enum(CARD_THEMES.map(t => t.id) as [string, ...string[]]);
const stickerEnum = z.enum(STICKERS.map(s => s.id) as [string, ...string[]]);

const emailSchema = z
  .string()
  .transform(v => v.trim().toLowerCase())
  .pipe(z.string().email());

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(80),
  category: categoryEnum,
  city: z.string().trim().min(2).max(50),
  startsAt: z.string().datetime({ offset: true }),
  price: z.number().int().min(0).max(1_000_000),
  description: z.string().trim().min(10).max(1000),
  imageUrl: z.string().url().max(500).refine(v => v.startsWith('http://') || v.startsWith('https://'), 'Must be http(s) URL'),
});

export const updateEventStatusSchema = z.object({
  isActive: z.boolean(),
});

export const filtersSchema = z.object({
  category: categoryEnum.optional(),
  city: z.string().trim().optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(6),
});

export const favouritesSchema = z.object({
  categories: z.array(categoryEnum).min(1).max(5),
});

export const cardDesignSchema = z.object({
  theme: themeEnum,
  stickers: z.array(stickerEnum).max(3),
});

export const adminPageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export function normalizeCity(city: string): string {
  return city.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function escapeSearchText(text: string): string {
  return text.replace(/[%_]/g, '\\$&');
}