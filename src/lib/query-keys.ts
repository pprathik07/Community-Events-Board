export const queryKeys = {
  events: {
    list: (filters: { category?: string; city?: string; q?: string; page?: number; pageSize?: number }) =>
      ['events', 'list', filters] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
    filters: () => ['events', 'filters'] as const,
  },
  feed: (page: number) => ['events', 'feed', page] as const,
  favourites: () => ['favourites'] as const,
  card: (eventId: string) => ['card', eventId] as const,
  admin: {
    events: (page: number) => ['admin', 'events', page] as const,
  },
  me: () => ['me'] as const,
} as const;