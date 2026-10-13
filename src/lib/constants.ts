export const CATEGORIES = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Single source of truth for category badge colours.
 * Use `categoryStyle()` so cards, filters, feed and admin all stay in sync.
 */
export const CATEGORY_STYLES: Record<Category, { bg: string; text: string }> = {
  Music: { bg: '#F3E8FF', text: '#7E22CE' },
  Workshop: { bg: '#DBEAFE', text: '#1D4ED8' },
  Food: { bg: '#FFEDD5', text: '#C2410C' },
  Sports: { bg: '#DCFCE7', text: '#15803D' },
  Kids: { bg: '#FCE7F3', text: '#BE185D' },
};

const FALLBACK_CATEGORY_STYLE = { bg: '#EEF2FF', text: '#4338CA' };

/** Inline style for a category badge; unknown categories fall back to the accent. */
export function categoryStyle(category: string): { backgroundColor: string; color: string } {
  const style = CATEGORY_STYLES[category as Category] ?? FALLBACK_CATEGORY_STYLE;
  return { backgroundColor: style.bg, color: style.text };
}

export const CARD_THEMES = [
  { id: 'sunset', name: 'Sunset', background: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)' },
  { id: 'ocean', name: 'Ocean', background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)' },
  { id: 'midnight', name: 'Midnight', background: 'linear-gradient(135deg, #1E293B 0%, #6366F1 100%)' },
] as const;
export type CardThemeId = (typeof CARD_THEMES)[number]['id'];

export const STICKERS = [
  { id: 'music', emoji: '🎵', label: 'Music note' },
  { id: 'party', emoji: '🎉', label: 'Party popper' },
  { id: 'food', emoji: '🍕', label: 'Pizza slice' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
] as const;
export type StickerId = (typeof STICKERS)[number]['id'];

/** Maximum stickers allowed on a single card. */
export const MAX_STICKERS = 3;
