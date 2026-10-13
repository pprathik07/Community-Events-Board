const inrFormatter = new Intl.NumberFormat('en-IN');

/**
 * Prices read `Free` when zero, otherwise `₹1,50,000` (Indian grouping).
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free';
  return '₹' + inrFormatter.format(amount);
}

/** Backwards-compatible alias. */
export const formatINR = formatPrice;

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Friendly date + time, e.g. `Sat, 18 Oct, 6:30 PM`.
 * Pinned to Asia/Kolkata so the string is stable regardless of server locale.
 */
export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  const day = dayFormatter.format(date); // Sat, 18 Oct
  const time = timeFormatter.format(date).toUpperCase(); // 6:30 PM
  return `${day}, ${time}`;
}
