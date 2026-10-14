'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface SessionUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export function useSession() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => api.auth.me(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const mutate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.me() });
  }, [queryClient]);

  const logout = useCallback(async () => {
    await api.auth.logout();

    // Clear every cached query so no user-scoped data (feed, favourites,
    // reminders) survives the session…
    queryClient.clear();
    // …then re-seed the session key as `null`. A plain invalidate is not
    // enough: when the follow-up refetch fails with 401, React Query keeps the
    // previous successful `me` payload and the header would still look signed
    // in until a hard reload.
    queryClient.setQueryData(queryKeys.me(), null);
  }, [queryClient]);

  return {
    data: data?.user as SessionUser | undefined,
    isLoading,
    isError: !!error,
    mutate,
    logout,
  };
}