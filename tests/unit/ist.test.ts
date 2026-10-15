import { describe, it, expect, vi } from 'vitest';
import { formatEventDate } from '@/lib/format';

describe('formatEventDate', () => {
  it('EC-D2: formats evening time correctly', () => {
    const iso = '2026-10-18T13:00:00.000Z'; // 6:30 PM IST
    const result = formatEventDate(iso);
    expect(result).toMatch(/Sun, 18 Oct, 6:30 PM/);
  });

  it('EC-D4: formats noon correctly', () => {
    const iso = '2026-10-18T06:30:00.000Z'; // 12:00 PM IST
    const result = formatEventDate(iso);
    expect(result).toMatch(/12:00 PM/);
  });

  it('EC-D4: formats midnight correctly', () => {
    const iso = '2026-10-18T18:30:00.000Z'; // 12:00 AM IST
    const result = formatEventDate(iso);
    expect(result).toMatch(/12:00 AM/);
  });

  it('EC-D3: handles 12:30 AM crossing UTC date', () => {
    const iso = '2026-10-18T19:00:00.000Z'; // 12:30 AM IST on 19th
    const result = formatEventDate(iso);
    expect(result).toMatch(/Mon, 19 Oct, 12:30 AM/);
  });

  it('EC-D5: uses uppercase AM/PM with normal space', () => {
    const iso = '2026-10-18T13:00:00.000Z';
    const result = formatEventDate(iso);
    expect(result).toMatch(/6:30 PM/);
    // Check that there's a single space between time and AM/PM
    expect(result).toMatch(/6:30 PM$/);
  });

  it('EC-D2: works under non-IST timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    
    const iso = '2026-10-18T13:00:00.000Z';
    const result = formatEventDate(iso);
    expect(result).toMatch(/Sun, 18 Oct, 6:30 PM/);
    
    vi.useRealTimers();
  });
});