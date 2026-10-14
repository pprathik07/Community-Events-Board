'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import {
  CARD_THEMES,
  STICKERS,
  MAX_STICKERS,
  categoryStyle,
  type CardThemeId,
  type StickerId,
} from '@/lib/constants';
import { formatEventDate, formatPrice } from '@/lib/format';
import { buttonClasses } from './ui/button';
import { X } from 'lucide-react';

interface CardDesignerProps {
  event: {
    id: string;
    title: string;
    category: string;
    city: string;
    startsAt: string;
    price: number;
  };
  initialTheme: CardThemeId;
  initialStickers: StickerId[];
}

// Fixed slots in the upper half so stickers never cover the title/date block.
const STICKER_SLOTS = [
  { top: '6%', right: '8%' },
  { top: '6%', left: '8%' },
  { top: '30%', right: '8%' },
] as const;

const STICKER_BY_ID = new Map<string, (typeof STICKERS)[number]>(STICKERS.map((s) => [s.id, s]));

interface CardPreviewProps {
  event: CardDesignerProps['event'];
  theme: CardThemeId;
  stickers: StickerId[];
  onRemove?: (index: number) => void;
  reduceMotion?: boolean;
}

function CardPreview({ event, theme, stickers, onRemove, reduceMotion = false }: CardPreviewProps) {
  return (
    <div className="relative aspect-[4/5] w-full max-w-[320px] mx-auto rounded-2xl overflow-hidden shadow-soft">
      {/* Split gradients can't transition directly — cross-fade stacked layers. */}
      {CARD_THEMES.map((t) => (
        <div
          key={t.id}
          aria-hidden
          className="absolute inset-0 transition-opacity duration-300"
          style={{ background: t.background, opacity: theme === t.id ? 1 : 0 }}
        />
      ))}

      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/35" />

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={categoryStyle(event.category)}
        >
          {event.category}
        </span>
        <h3 className="mt-2 text-lg font-semibold leading-snug line-clamp-2 drop-shadow">{event.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm opacity-95">
          <span>{formatEventDate(event.startsAt)}</span>
          <span aria-hidden>•</span>
          <span>{event.city}</span>
          <span aria-hidden>•</span>
          <span>{formatPrice(event.price)}</span>
        </div>
      </div>

      <AnimatePresence>
        {stickers.map((stickerId, index) => {
          const sticker = STICKER_BY_ID.get(stickerId);
          if (!sticker) return null;
          return (
            <motion.div
              key={`${stickerId}-${index}`}
              initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute filter drop-shadow-lg"
              style={STICKER_SLOTS[index % STICKER_SLOTS.length]}
            >
              <div className="relative">
                <span className="text-4xl" role="img" aria-label={sticker.label}>
                  {sticker.emoji}
                </span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label={`Remove ${sticker.label}`}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white text-ink shadow-card flex items-center justify-center hover:bg-brand-soft transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function CardDesigner({ event, initialTheme, initialStickers }: CardDesignerProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion() ?? false;
  const { data: session, isLoading } = useSession();
  const [theme, setTheme] = useState<CardThemeId>(initialTheme);
  const [stickers, setStickers] = useState<StickerId[]>(initialStickers);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<{ theme: CardThemeId; stickers: StickerId[] }>({
    theme: initialTheme,
    stickers: initialStickers,
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const saveMutation = useMutation({
    mutationFn: (data: { theme: CardThemeId; stickers: StickerId[] }) => api.events.card.set(event.id, data),
    onSuccess: (data) => {
      setLastSaved({ theme: data.theme, stickers: data.stickers });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      queryClient.setQueryData(queryKeys.card(event.id), data);
    },
    onError: () => {
      setTheme(lastSaved.theme);
      setStickers(lastSaved.stickers);
      setSaveStatus('error');
      toast.error("Couldn't save your design. Please try again.");
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const debouncedSave = useCallback(
    (newTheme: CardThemeId, newStickers: StickerId[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus('saving');
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate({ theme: newTheme, stickers: newStickers });
      }, 500);
    },
    [saveMutation]
  );

  const handleThemeChange = useCallback(
    (newTheme: CardThemeId) => {
      setTheme(newTheme);
      debouncedSave(newTheme, stickers);
    },
    [debouncedSave, stickers]
  );

  const handleAddSticker = useCallback(
    (stickerId: StickerId) => {
      if (stickers.length >= MAX_STICKERS) return;
      const next = [...stickers, stickerId];
      setStickers(next);
      debouncedSave(theme, next);
    },
    [debouncedSave, stickers, theme]
  );

  const handleRemoveSticker = useCallback(
    (index: number) => {
      const next = stickers.filter((_, i) => i !== index);
      setStickers(next);
      debouncedSave(theme, next);
    },
    [debouncedSave, stickers, theme]
  );

  const isFull = stickers.length >= MAX_STICKERS;

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-line shadow-soft p-5 sm:p-6 space-y-6">
        <div className="h-6 w-40 rounded-md skeleton" />
        <div className="aspect-[4/5] w-full max-w-[320px] mx-auto rounded-2xl skeleton" />
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full skeleton" />
            <div className="w-11 h-11 rounded-full skeleton" />
            <div className="w-11 h-11 rounded-full skeleton" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-surface rounded-2xl border border-line shadow-soft p-5 sm:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-ink">Design your card</h2>
        <div className="relative">
          <CardPreview event={event} theme={initialTheme} stickers={[]} />
          <div className="absolute inset-0 max-w-[320px] mx-auto rounded-2xl bg-black/45 flex items-center justify-center">
            <p className="px-6 text-center text-white font-medium">Log in to design and save your card</p>
          </div>
        </div>
        <Link href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`} className={cn(buttonClasses('primary'), 'w-full')}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-5 sm:p-6 space-y-6">
      <h2 className="text-lg font-semibold text-ink">Design your card</h2>

      <CardPreview
        event={event}
        theme={theme}
        stickers={stickers}
        onRemove={handleRemoveSticker}
        reduceMotion={reduceMotion}
      />

      <div className="space-y-5">
        {/* Themes */}
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Theme</label>
          <div className="flex gap-3" role="radiogroup" aria-label="Card theme">
            {CARD_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  role="radio"
                  aria-checked={active}
                  aria-label={t.name}
                  title={t.name}
                  className={cn(
                    'w-11 h-11 rounded-full transition-all',
                    active ? 'ring-2 ring-brand ring-offset-2' : 'ring-1 ring-line hover:ring-brand/50'
                  )}
                  style={{ background: t.background }}
                />
              );
            })}
          </div>
        </div>

        {/* Stickers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-muted">Stickers</label>
            <span className="text-xs text-muted" aria-live="polite">
              {stickers.length} of {MAX_STICKERS} stickers
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Stickers">
            {STICKERS.map((sticker) => {
              const placed = stickers.includes(sticker.id);
              const disabled = !placed && isFull;
              return (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => handleAddSticker(sticker.id)}
                  disabled={disabled}
                  aria-label={`Add ${sticker.label}`}
                  className={cn(
                    'w-12 h-12 rounded-full text-xl flex items-center justify-center border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                    placed
                      ? 'bg-brand-soft border-brand'
                      : 'bg-surface border-line hover:bg-brand-soft',
                    disabled && 'opacity-40 cursor-not-allowed hover:bg-surface'
                  )}
                >
                  <span role="img" aria-hidden>
                    {sticker.emoji}
                  </span>
                </button>
              );
            })}
          </div>
          {isFull && <p className="mt-2 text-xs text-muted">Max {MAX_STICKERS} stickers. Remove one to add another.</p>}
        </div>

        <div className="text-xs" aria-live="polite">
          <span
            className={cn(
              'font-medium',
              saveStatus === 'saving' && 'text-brand',
              saveStatus === 'saved' && 'text-success',
              saveStatus === 'error' && 'text-danger',
              saveStatus === 'idle' && 'text-muted'
            )}
          >
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
            {saveStatus === 'idle' && 'Changes saved automatically'}
          </span>
        </div>
      </div>
    </div>
  );
}
