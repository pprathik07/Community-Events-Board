'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { formatPrice, formatEventDate } from '@/lib/format';
import { RemindButton } from '@/components/remind-button';
import { CardDesigner } from '@/components/card-designer';
import { ErrorState, EmptyState } from '@/components/state-views';
import { CategoryBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin, Calendar, ArrowLeft, Clock } from 'lucide-react';

function DetailSkeleton() {
  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-[16/9] rounded-2xl skeleton" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 rounded-md skeleton" />
          <div className="h-4 w-1/2 rounded-md skeleton" />
          <div className="h-4 w-2/3 rounded-md skeleton" />
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="aspect-[4/5] w-full max-w-[320px] rounded-2xl skeleton" />
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const backParams = searchParams.get('back') || '';
  const [imageFailed, setImageFailed] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => api.events.detail(eventId),
    enabled: !!eventId,
  });

  const backLink = (
    <Link
      href={`/?${backParams}`}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to events
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {backLink}
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6">
        {backLink}
        {isError ? (
          <ErrorState message="Something went wrong loading this event." onRetry={() => refetch()} />
        ) : (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title="Event not found"
            description="This event may have been removed or is no longer available."
            action={
              <Link
                href={`/?${backParams}`}
                className="inline-flex items-center h-11 px-5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-ink transition-colors"
              >
                Back to events
              </Link>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {backLink}

      <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-line">
            {imageFailed ? (
              <div className="absolute inset-0 bg-brand-gradient flex items-center justify-center">
                <Calendar className="w-12 h-12 text-white/70" />
              </div>
            ) : (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={event.category} />
              <span className="inline-flex items-center gap-1 text-sm text-muted">
                <MapPin className="w-4 h-4" />
                {event.city}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{event.title}</h1>

            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Clock className="w-4 h-4" />
              <span>{formatEventDate(event.startsAt)}</span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-line">
              <span className="text-2xl font-bold text-ink tabular-nums">{formatPrice(event.price)}</span>
              <RemindButton eventId={event.id} initiallyReminded={event.isReminded ?? false} />
            </div>

            <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
          <CardDesigner
            event={event}
            initialTheme={event.cardDesign?.theme || 'sunset'}
            initialStickers={event.cardDesign?.stickers || []}
          />
        </div>
      </div>
    </div>
  );
}
