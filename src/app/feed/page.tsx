'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { EventCard } from '@/components/event-card';
import { Pagination } from '@/components/pagination';
import { LoadingSkeleton, ErrorState, FeedEmptyState } from '@/components/state-views';

function FeedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.feed(page),
    queryFn: useCallback(() => api.me.feed(page), [page]),
    placeholderData: (previousData) => previousData,
  });

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleChooseCategories = useCallback(() => {
    router.push('/favourites');
  }, [router]);

  // Stable reference (never a fresh []) so memoized children can bail out.
  const favCategories = useMemo(() => data?.favouriteCategories ?? [], [data]);

  const title = <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">My Feed</h1>;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {title}
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {title}
        <ErrorState message="Something went wrong loading your feed." onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title}

      {favCategories.length > 0 && (
        <p className="text-sm text-muted">
          Showing events from:{' '}
          <span className="font-medium text-ink">{favCategories.join(', ')}</span>{' '}
          <Link href="/favourites" className="text-brand font-medium hover:underline">
            Edit
          </Link>
        </p>
      )}

      {data?.items.length === 0 ? (
        <FeedEmptyState hasFavourites={favCategories.length > 0} onChooseCategories={handleChooseCategories} />
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

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedPageContent />
    </Suspense>
  );
}
