'use client';

import { useState, Suspense, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminPaginatedEvents, PaginatedEvents } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { formatEventDate } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/state-views';
import { CategoryBadge, StatusBadge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  isActive: boolean;
  isPast?: boolean;
}

function ToggleSwitch({
  checked,
  disabled,
  onToggle,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        checked ? 'bg-brand' : 'bg-line',
        disabled && 'opacity-60 cursor-wait'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function RowActions({ event, isPendingRow, onToggle }: { event: AdminEvent; isPendingRow: boolean; onToggle: (id: string, current: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <ToggleSwitch
        checked={event.isActive}
        disabled={isPendingRow}
        onToggle={() => onToggle(event.id, event.isActive)}
        label={event.isActive ? 'Deactivate event' : 'Activate event'}
      />
      <span className={cn('text-sm font-medium', event.isActive ? 'text-success' : 'text-muted')}>
        {event.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

// Memoized row: only the row whose status is toggling re-renders.
const AdminTableRow = memo(function AdminTableRow({
  event,
  isPendingRow,
  onToggle,
}: {
  event: AdminEvent;
  isPendingRow: boolean;
  onToggle: (id: string, current: boolean) => void;
}) {
  return (
    <tr className="border-b border-line/60 hover:bg-brand/5 transition-colors">
      <td className="p-4">
        <div className="font-medium text-ink">{event.title}</div>
        <div className="text-sm text-muted truncate max-w-xs">{event.description}</div>
      </td>
      <td className="p-4"><CategoryBadge category={event.category} /></td>
      <td className="p-4 text-sm text-muted">{event.city}</td>
      <td className="p-4 text-sm text-muted whitespace-nowrap">{formatEventDate(event.startsAt)}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <StatusBadge isActive={event.isActive} />
          {event.isPast && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning">Past</span>}
        </div>
      </td>
      <td className="p-4 text-right"><RowActions event={event} isPendingRow={isPendingRow} onToggle={onToggle} /></td>
    </tr>
  );
});

const AdminCard = memo(function AdminCard({
  event,
  isPendingRow,
  onToggle,
}: {
  event: AdminEvent;
  isPendingRow: boolean;
  onToggle: (id: string, current: boolean) => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-soft p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink leading-snug">{event.title}</h3>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge isActive={event.isActive} />
          {event.isPast && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning">Past</span>}
        </div>
      </div>

      <p className="text-sm text-muted line-clamp-2">{event.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
        <CategoryBadge category={event.category} />
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          {event.city}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {formatEventDate(event.startsAt)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-line">
        <span className="text-sm font-medium text-ink">Status</span>
        <RowActions event={event} isPendingRow={isPendingRow} onToggle={onToggle} />
      </div>
    </div>
  );
});

function AdminEventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [isPending, setIsPending] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.events(page),
    queryFn: () => api.admin.events.list(page),
    placeholderData: (previousData) => previousData,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.admin.events.toggleStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      setIsPending(id);
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.events(page) });
      await queryClient.cancelQueries({ queryKey: queryKeys.events.list({}) });
      await queryClient.cancelQueries({ queryKey: queryKeys.events.filters() });

      const adminSnapshot = queryClient.getQueryData(queryKeys.admin.events(page));
      const publicSnapshot = queryClient.getQueriesData({ queryKey: queryKeys.events.list({}) });
      const filtersSnapshot = queryClient.getQueryData(queryKeys.events.filters());

      queryClient.setQueryData<AdminPaginatedEvents>(queryKeys.admin.events(page), (old) =>
        old
          ? { ...old, items: old.items.map((item) => (item.id === id ? { ...item, isActive } : item)) }
          : old
      );

      // Public lists only hold active events: activating changes nothing until a
      // refetch, deactivating removes the row optimistically.
      const patchList = (data: unknown): unknown => {
        const pageData = data as PaginatedEvents | undefined;
        if (!pageData?.items) return data;
        if (isActive) return data;
        return { ...pageData, items: pageData.items.filter((item) => item.id !== id) };
      };

      publicSnapshot.forEach(([key, data]) => queryClient.setQueryData(key, patchList(data)));

      return { adminSnapshot, publicSnapshot, filtersSnapshot };
    },
    onError: (_err, _variables, context) => {
      if (context?.adminSnapshot) queryClient.setQueryData(queryKeys.admin.events(page), context.adminSnapshot);
      if (context?.publicSnapshot) {
        context.publicSnapshot.forEach(([key, d]) => queryClient.setQueryData(key, d));
      }
      if (context?.filtersSnapshot) queryClient.setQueryData(queryKeys.events.filters(), context.filtersSnapshot);
      toast.error('Failed to update event status');
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isActive ? 'Event activated' : 'Event deactivated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.events(page) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.filters() });
      setIsPending(null);
    },
  });

  const handleToggle = useCallback(
    (id: string, currentStatus: boolean) => {
      toggleMutation.mutate({ id, isActive: !currentStatus });
    },
    [toggleMutation]
  );

  const header = (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Events</h1>
      <Link
        href="/admin/events/new"
        className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-ink transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add event
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingSkeleton count={5} variant="table" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState message="Something went wrong loading events." onRetry={() => refetch()} />
      </div>
    );
  }

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(next));
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {header}

      {data?.items.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No events yet"
          description="Create your first event to get started."
          action={
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-ink transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add event
            </Link>
          }
        />
      ) : (
        <>
          {/* Phone: stacked cards. Laptop: table. */}
          <div className="md:hidden space-y-3">
            {data?.items.map((event) => (
              <AdminCard key={event.id} event={event} isPendingRow={isPending === event.id} onToggle={handleToggle} />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-left text-sm font-medium text-muted">
                  <th className="p-4">Event</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((event) => (
                  <AdminTableRow
                    key={event.id}
                    event={event}
                    isPendingRow={isPending === event.id}
                    onToggle={handleToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-sm font-medium text-ink">
              Page {page} of {data?.totalPages || 1}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= (data?.totalPages || 1)}
              aria-label="Next page"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <Suspense fallback={null}>
      <AdminEventsPageContent />
    </Suspense>
  );
}
