'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventDetail, FeedResponse, PaginatedEvents } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Bell, BellRing, Check } from 'lucide-react';
import { memo, useCallback, useState, useRef } from 'react';

interface RemindButtonProps {
  eventId: string;
  /** Server state, read on load so the label survives a refresh. */
  initiallyReminded: boolean;
}

export const RemindButton = memo(function RemindButton({ eventId, initiallyReminded }: RemindButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReminded, setIsReminded] = useState(initiallyReminded);
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? api.events.reminder.set(eventId) : api.events.reminder.unset(eventId)),
    onMutate: async (next) => {
      if (pendingRef.current) return;
      pendingRef.current = true;

      await queryClient.cancelQueries({ queryKey: queryKeys.events.list({}) });

      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.events.list({}) });

      const patchList = (data: unknown): unknown => {
        const page = data as PaginatedEvents | undefined;
        if (!page?.items) return data;
        return {
          ...page,
          items: page.items.map((item) =>
            item.id === eventId ? { ...item, isReminded: next } : item
          ),
        };
      };

      snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, patchList(data));
      });

      queryClient.setQueryData<EventDetail>(queryKeys.events.detail(eventId), (old) =>
        old ? { ...old, isReminded: next } : old
      );

      queryClient.setQueryData<FeedResponse>(queryKeys.feed(1), (old) =>
        old
          ? { ...old, items: old.items.map((item) => (item.id === eventId ? { ...item, isReminded: next } : item)) }
          : old
      );

      // Flip the UI instantly.
      setIsReminded(next);

      return { snapshot };
    },
    onError: (_err, _next, context) => {
      // Roll back to the previous state and tell the user.
      if (context?.snapshot) {
        context.snapshot.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      setIsReminded(initiallyReminded);
      toast.error("Couldn't save your reminder. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed(1) });
      pendingRef.current = false;
      setIsPending(false);
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (pendingRef.current || isPending) return;

    const session = queryClient.getQueryData(queryKeys.me()) as { user?: { role: string } } | undefined;
    if (!session?.user) {
      const next = searchParams?.toString() ? `/login?next=${encodeURIComponent(searchParams.toString())}` : '/login';
      router.push(next);
      return;
    }

    if (session.user.role !== 'user') {
      toast.error('Please log in with a visitor account to set reminders.');
      return;
    }

    setIsPending(true);
    mutation.mutate(!isReminded);
  }, [isPending, isReminded, mutation, queryClient, router, searchParams]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isReminded}
      aria-busy={isPending}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        isReminded
          ? 'bg-success/10 text-success border border-success/30'
          : 'bg-surface text-ink border border-line hover:bg-brand-soft hover:border-brand/40',
        isPending && 'opacity-70'
      )}
    >
      {isReminded ? (
        <>
          <BellRing className="w-4 h-4" />
          <span>Reminder set</span>
          <Check className="w-3.5 h-3.5" />
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span>Remind me</span>
        </>
      )}
      {isPending && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
    </button>
  );
});
