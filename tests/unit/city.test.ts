import { describe, it, expect } from 'vitest';
import { normalizeCity } from '@/lib/utils';

describe('normalizeCity', () => {
  it('EC-F7, EC-AD6: normalizes lowercase', () => {
    expect(normalizeCity('coimbatore')).toBe('Coimbatore');
  });

  it('EC-F7, EC-AD6: normalizes uppercase', () => {
    expect(normalizeCity('COIMBATORE')).toBe('Coimbatore');
  });

  it('EC-F7, EC-AD6: normalizes with spaces', () => {
    expect(normalizeCity(' new delhi ')).toBe('New Delhi');
  });

  it('EC-AD6: preserves Bangalore and Bengaluru as different', () => {
    expect(normalizeCity('bangalore')).toBe('Bangalore');
    expect(normalizeCity('bengaluru')).toBe('Bengaluru');
  });

  it('handles multi-word cities', () => {
    expect(normalizeCity('san francisco')).toBe('San Francisco');
    expect(normalizeCity('los angeles')).toBe('Los Angeles');
  });
});