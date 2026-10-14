'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { formatPrice, formatEventDate } from '@/lib/format';
import { RemindButton } from './remind-button';
import { CategoryBadge } from './ui/badge';
import { Calendar, MapPin, Music, Hammer, Utensils, Trophy, Baby, Tag } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    category: string;
    city: string;
    startsAt: string;
    price: number;
    imageUrl: string;
    isReminded?: boolean;
  };
}

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Workshop: Hammer,
  Food: Utensils,
  Sports: Trophy,
  Kids: Baby,
};

/** Small category glyphs reused by the designer, detail page and admin list. */
export const categoryIcons: Record<string, React.ReactNode> = {
  Music: <Music className="w-3 h-3" />,
  Workshop: <Hammer className="w-3 h-3" />,
  Food: <Utensils className="w-3 h-3" />,
  Sports: <Trophy className="w-3 h-3" />,
  Kids: <Baby className="w-3 h-3" />,
};

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col bg-surface rounded-2xl overflow-hidden border border-line shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 hover:border-brand/25"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-line">
        {imageFailed ? (
          <div className="absolute inset-0 bg-brand-gradient flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white/70" />
          </div>
        ) : (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={event.category}>
            <span className="w-3.5 h-3.5 flex items-center justify-center">{categoryIcons[event.category] ?? <Tag className="w-3 h-3" />}</span>
            {event.category}
          </CategoryBadge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <MapPin className="w-3.5 h-3.5" />
            {event.city}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-ink line-clamp-2 group-hover:text-brand transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formatEventDate(event.startsAt)}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-line">
          <span className="font-bold tabular-nums text-ink">{formatPrice(event.price)}</span>
          <RemindButton eventId={event.id} initiallyReminded={event.isReminded ?? false} />
        </div>
      </div>
    </Link>
  );
});

// Kept for callers that map a category to its icon component.
export { CATEGORY_ICON_MAP };
