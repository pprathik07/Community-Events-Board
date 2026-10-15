import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema, createEventSchema, filtersSchema, favouritesSchema, cardDesignSchema, adminPageSchema } from '@/lib/validation';

describe('validation schemas', () => {
  describe('signupSchema', () => {
    it('accepts valid email and password >= 8', () => {
      const result = signupSchema.safeParse({ email: 'test@example.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('rejects password < 8 chars', () => {
      const result = signupSchema.safeParse({ email: 'test@example.com', password: 'short' });
      expect(result.success).toBe(false);
    });

    it('rejects password > 72 chars', () => {
      const result = signupSchema.safeParse({ email: 'test@example.com', password: 'a'.repeat(73) });
      expect(result.success).toBe(false);
    });

    it('lowercases and trims email', () => {
      const result = signupSchema.safeParse({ email: '  TEST@EXAMPLE.COM  ', password: 'password123' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password' });
      expect(result.success).toBe(true);
    });
  });

  describe('createEventSchema', () => {
    const validEvent = {
      title: 'Test Event',
      category: 'Music',
      city: 'Coimbatore',
      startsAt: '2026-10-18T13:00:00.000Z',
      price: 499,
      description: 'A test event description',
      imageUrl: 'https://example.com/image.jpg',
    };

    it('accepts valid event', () => {
      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('rejects title < 3 chars', () => {
      const result = createEventSchema.safeParse({ ...validEvent, title: 'Ab' });
      expect(result.success).toBe(false);
    });

    it('rejects title > 80 chars', () => {
      const result = createEventSchema.safeParse({ ...validEvent, title: 'a'.repeat(81) });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = createEventSchema.safeParse({ ...validEvent, category: 'Dance' });
      expect(result.success).toBe(false);
    });

    it('rejects city < 2 chars', () => {
      const result = createEventSchema.safeParse({ ...validEvent, city: 'C' });
      expect(result.success).toBe(false);
    });

    it('rejects price < 0', () => {
      const result = createEventSchema.safeParse({ ...validEvent, price: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects price > 10,00,000', () => {
      const result = createEventSchema.safeParse({ ...validEvent, price: 1000001 });
      expect(result.success).toBe(false);
    });

    it('rejects description < 10 chars', () => {
      const result = createEventSchema.safeParse({ ...validEvent, description: 'Short' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid image URL', () => {
      const result = createEventSchema.safeParse({ ...validEvent, imageUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects non-http(s) image URL', () => {
      const result = createEventSchema.safeParse({ ...validEvent, imageUrl: 'javascript:alert(1)' });
      expect(result.success).toBe(false);
    });

    it('rejects zone-less datetime', () => {
      const result = createEventSchema.safeParse({ ...validEvent, startsAt: '2026-10-18T18:30:00' });
      expect(result.success).toBe(false);
    });
  });

  describe('filtersSchema', () => {
    it('defaults page=1, pageSize=6', () => {
      const result = filtersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(6);
      }
    });

    it('coerces page and pageSize', () => {
      const result = filtersSchema.safeParse({ page: '2', pageSize: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('rejects page < 1', () => {
      const result = filtersSchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('rejects pageSize > 20', () => {
      const result = filtersSchema.safeParse({ pageSize: '21' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = filtersSchema.safeParse({ category: 'Dance' });
      expect(result.success).toBe(false);
    });

    it('rejects q > 80 chars', () => {
      const result = filtersSchema.safeParse({ q: 'a'.repeat(81) });
      expect(result.success).toBe(false);
    });
  });

  describe('favouritesSchema', () => {
    it('accepts 1-5 valid categories', () => {
      const result = favouritesSchema.safeParse({ categories: ['Music', 'Food'] });
      expect(result.success).toBe(true);
    });

    it('rejects empty array', () => {
      const result = favouritesSchema.safeParse({ categories: [] });
      expect(result.success).toBe(false);
    });

    it('rejects > 5 categories', () => {
      const result = favouritesSchema.safeParse({ categories: ['Music', 'Food', 'Sports', 'Kids', 'Workshop', 'Dance'] });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = favouritesSchema.safeParse({ categories: ['Music', 'Invalid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('cardDesignSchema', () => {
    it('accepts valid theme and stickers <= 3', () => {
      const result = cardDesignSchema.safeParse({ theme: 'sunset', stickers: ['music', 'party'] });
      expect(result.success).toBe(true);
    });

    it('rejects invalid theme', () => {
      const result = cardDesignSchema.safeParse({ theme: 'invalid', stickers: [] });
      expect(result.success).toBe(false);
    });

    it('rejects > 3 stickers', () => {
      const result = cardDesignSchema.safeParse({ theme: 'sunset', stickers: ['music', 'party', 'food', 'star'] });
      expect(result.success).toBe(false);
    });

    it('rejects invalid sticker id', () => {
      const result = cardDesignSchema.safeParse({ theme: 'sunset', stickers: ['invalid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('adminPageSchema', () => {
    it('defaults page=1', () => {
      const result = adminPageSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.page).toBe(1);
    });

    it('rejects page < 1', () => {
      const result = adminPageSchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });
  });
});