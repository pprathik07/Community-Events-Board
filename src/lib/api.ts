/**
 * Browser-side API client.
 *
 * IMPORTANT: This module is imported by client components, so it must never
 * import server-only modules (jwt.ts, env.ts, etc.). Next.js only inlines
 * NEXT_PUBLIC_* variables into the client bundle, so pulling in the server env
 * schema here would throw a ZodError in the browser. Auth is carried by the
 * httpOnly cookie, which the browser attaches automatically for same-origin
 * requests (see `credentials` below).
 */

// Literal unions for the card designer (type-only import — no runtime cost).
import type { CardThemeId, StickerId } from './constants';

/* ------------------------------------------------------------------ */
/*  Response DTO types — mirror the server's DTO mappers exactly.      */
/* ------------------------------------------------------------------ */

export interface SessionUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface EventSummary {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
  isReminded?: boolean;
}

export interface EventDetail extends EventSummary {
  isReminded: boolean;
  cardDesign: { theme: CardThemeId; stickers: StickerId[] } | null;
}

export interface AdminEventSummary {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  isPast?: boolean;
}

/** Payload for `POST /api/admin/events` (dates sent as ISO strings). */
export interface CreateEventInput {
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
}

export interface PaginatedEvents {
  items: EventSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminPaginatedEvents {
  items: AdminEventSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FeedResponse extends PaginatedEvents {
  favouriteCategories: string[];
}

export interface FiltersResponse {
  categories: string[];
  cities: string[];
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface MeResponse {
  user: SessionUser;
}

export interface FavouritesResponse {
  categories: string[];
}

export interface CardResponse {
  theme: CardThemeId;
  stickers: StickerId[];
}

export interface ReminderResponse {
  isReminded: boolean;
}

export interface AdminEventResponse {
  event: AdminEventSummary;
}

export interface OkResponse {
  ok: boolean;
}

/* ------------------------------------------------------------------ */
/*  Transport                                                          */
/* ------------------------------------------------------------------ */

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = data.error || { code: 'INTERNAL', message: 'An unexpected error occurred.' };
    throw new ApiError(response.status, err.code, err.message, err.fields);
  }

  return data as T;
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string }) =>
      fetchWithAuth('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }).then(handleResponse<SessionResponse>),
    login: (data: { email: string; password: string }) =>
      fetchWithAuth('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }).then(handleResponse<SessionResponse>),
    logout: () =>
      fetchWithAuth('/api/auth/logout', { method: 'POST' }).then(handleResponse<OkResponse>),
    me: () =>
      fetchWithAuth('/api/auth/me').then(handleResponse<MeResponse>),
  },
  events: {
    list: (params: { category?: string; city?: string; q?: string; page?: number; pageSize?: number }) => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => v !== undefined && search.set(k, String(v)));
      return fetchWithAuth(`/api/events?${search}`).then(handleResponse<PaginatedEvents>);
    },
    filters: () =>
      fetchWithAuth('/api/events/filters').then(handleResponse<FiltersResponse>),
    detail: (id: string) =>
      fetchWithAuth(`/api/events/${id}`).then(handleResponse<EventDetail>),
    reminder: {
      set: (id: string) =>
        fetchWithAuth(`/api/events/${id}/reminder`, { method: 'PUT' }).then(handleResponse<ReminderResponse>),
      unset: (id: string) =>
        fetchWithAuth(`/api/events/${id}/reminder`, { method: 'DELETE' }).then(handleResponse<ReminderResponse>),
    },
    card: {
      get: (id: string) =>
        fetchWithAuth(`/api/events/${id}/card`).then(handleResponse<CardResponse>),
      set: (id: string, data: { theme: string; stickers: string[] }) =>
        fetchWithAuth(`/api/events/${id}/card`, { method: 'PUT', body: JSON.stringify(data) }).then(handleResponse<CardResponse>),
    },
  },
  me: {
    favourites: {
      get: () =>
        fetchWithAuth('/api/me/favourites').then(handleResponse<FavouritesResponse>),
      set: (categories: string[]) =>
        fetchWithAuth('/api/me/favourites', { method: 'PUT', body: JSON.stringify({ categories }) }).then(handleResponse<FavouritesResponse>),
    },
    feed: (page = 1) =>
      fetchWithAuth(`/api/me/feed?page=${page}`).then(handleResponse<FeedResponse>),
  },
  admin: {
    events: {
      list: (page = 1) =>
        fetchWithAuth(`/api/admin/events?page=${page}`).then(handleResponse<AdminPaginatedEvents>),
      create: (data: CreateEventInput) =>
        fetchWithAuth('/api/admin/events', { method: 'POST', body: JSON.stringify(data) }).then(handleResponse<AdminEventResponse>),
      toggleStatus: (id: string, isActive: boolean) =>
        fetchWithAuth(`/api/admin/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }).then(handleResponse<AdminEventResponse>),
    },
  },
};
