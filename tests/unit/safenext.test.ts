import { describe, it, expect } from 'vitest';

function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

describe('safeNext', () => {
  it('EC-A10: accepts valid next', () => {
    expect(safeNext('/feed')).toBe('/feed');
    expect(safeNext('/events/123')).toBe('/events/123');
  });

  it('EC-A10: rejects full URL', () => {
    expect(safeNext('https://evil.com')).toBe('/');
  });

  it('EC-A10: rejects protocol-relative URL', () => {
    expect(safeNext('//evil.com')).toBe('/');
  });

  it('EC-A10: rejects empty', () => {
    expect(safeNext('')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});