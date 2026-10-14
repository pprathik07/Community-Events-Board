'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { EventCard } from '@/components/event-card';
import { FilterBar } from '@/components/filter-bar';
import { Pagination } from '@/components/pagination';
import { LoadingSkeleton, ErrorState, EventEmptyState } from '@/components/state-views';

function PageHeader() {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
        Community events near you
      </h1>
      <p className="text-muted sm:text-lg">
        Music, workshops, food, sports and fun for kids — all in one place.
      </p>
    </header>
  );
}

function EventsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || undefined;
  const city = searchParams.get('city') || undefined;
  const q = searchParams.get('q') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Derived query inputs: memoize so the key/fn identity only changes when
  // the actual filters change (not on every render).
  const eventsKey = useMemo(
    () => queryKeys.events.list({ category, city, q, page }),
    [category, city, q, page]
  );
  const fetchEvents = useCallback(
    () => api.events.list({ category, city, q, page }),
    [category, city, q, page]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: eventsKey,
    queryFn: fetchEvents,
    placeholderData: (previousData) => previousData,
  });

  const { data: filtersData } = useQuery({
    queryKey: queryKeys.events.filters(),
    queryFn: () => api.events.filters(),
  });

  const hasFilters = !!(category || city || q);
  const total = data?.total ?? 0;

  const handleClearFilters = useCallback(() => {
    router.push('/', { scroll: false });
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader />

      <FilterBar categories={filtersData?.categories || []} cities={filtersData?.cities || []} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          {isLoading ? 'Loading events…' : (
            <>
              <span className="font-semibold text-ink">{total}</span> event{total === 1 ? '' : 's'} found
            </>
          )}
        </p>
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm font-medium text-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} />
      ) : isError ? (
        <ErrorState message="Something went wrong loading events." onRetry={() => refetch()} />
      ) : data?.items.length === 0 ? (
        <EventEmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {data?.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination page={data?.page || 1} totalPages={data?.totalPages || 1} />
        </>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageContent />
    </Suspense>
  );
}
