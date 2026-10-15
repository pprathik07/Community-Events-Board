import { describe, it, expect } from 'vitest';
import { formatINR } from '@/lib/format';

describe('formatINR', () => {
  const cases = [
    { input: 0, expected: 'Free' },
    { input: 999, expected: '₹999' },
    { input: 1000, expected: '₹1,000' },
    { input: 10000, expected: '₹10,000' },
    { input: 100000, expected: '₹1,00,000' },
    { input: 150000, expected: '₹1,50,000' },
    { input: 1000000, expected: '₹10,00,000' },
  ];

  cases.forEach(({ input, expected }) => {
    it(`EC-M${cases.indexOf({ input, expected }) + 1}: formats ${input} as ${expected}`, () => {
      expect(formatINR(input)).toBe(expected);
    });
  });
});