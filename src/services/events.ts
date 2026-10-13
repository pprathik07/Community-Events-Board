import { prisma } from '@/lib/db';
import { publicEventWhere, buildEventWhere } from './visibility';
import { normalizeCity } from '@/lib/validation';

export interface EventFilters {
  category?: string;
  city?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicEventItem {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  price: number;
  description: string;
  imageUrl: string;
  isReminded: boolean;
}

export interface PaginatedEvents {
  items: PublicEventItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function listEvents(filters: EventFilters, userId?: string): Promise<PaginatedEvents> {
  const now = new Date();
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 6, 20);
  const skip = (page - 1) * pageSize;

  const where = buildEventWhere(now, filters);
  const hasSearch = !!filters.q;
  // SQLite has no case-insensitive `mode` and we filter in memory anyway, so
  // just lowercase both sides. `%`/`_` are treated as literal characters.
  const searchTerm = hasSearch ? filters.q!.trim().toLowerCase() : null;

  // Fetch the full filtered set (no SQL-level search) and paginate in memory.
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      skip: hasSearch ? 0 : skip,
      take: hasSearch ? undefined : pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  let filteredEvents = events;
  if (hasSearch && searchTerm) {
    filteredEvents = events.filter(e =>
      e.title.toLowerCase().includes(searchTerm) ||
      e.description.toLowerCase().includes(searchTerm)
    );
  }

  const paginatedEvents = hasSearch 
    ? filteredEvents.slice(skip, skip + pageSize)
    : filteredEvents;

  let reminders = new Set<string>();
  if (userId && paginatedEvents.length > 0) {
    const userReminders = await prisma.reminder.findMany({
      where: { userId, eventId: { in: paginatedEvents.map(e => e.id) } },
      select: { eventId: true },
    });
    reminders = new Set(userReminders.map(r => r.eventId));
  }

  const items = paginatedEvents.map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    city: e.city,
    startsAt: e.startsAt.toISOString(),
    price: e.price,
    description: e.description,
    imageUrl: e.imageUrl,
    isReminded: reminders.has(e.id),
  }));

  const filteredTotal = hasSearch ? filteredEvents.length : total;

  return {
    items,
    page,
    pageSize,
    total: filteredTotal,
    totalPages: Math.ceil(filteredTotal / pageSize),
  };
}

export async function getEventById(id: string, userId?: string) {
  const now = new Date();
  const event = await prisma.event.findFirst({
    where: { id, ...publicEventWhere(now) },
  });

  if (!event) return null;

  let isReminded = false;
  let cardDesign: { theme: string; stickers: string[] } | null = null;

  if (userId) {
    const [reminder, design] = await Promise.all([
      prisma.reminder.findUnique({ where: { userId_eventId: { userId, eventId: id } } }),
      prisma.cardDesign.findUnique({ where: { userId_eventId: { userId, eventId: id } } }),
    ]);
    isReminded = !!reminder;

    if (design) {
      let stickers: string[] = [];
      try {
        stickers = JSON.parse(design.stickers);
      } catch {
        stickers = [];
      }
      cardDesign = { theme: design.theme, stickers };
    }
  }

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    price: event.price,
    description: event.description,
    imageUrl: event.imageUrl,
    isReminded,
    cardDesign,
  };
}

export async function getFilters() {
  const now = new Date();
  const [categories, cities] = await Promise.all([
    prisma.event.findMany({
      where: publicEventWhere(now),
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
    prisma.event.findMany({
      where: publicEventWhere(now),
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    }),
  ]);

  return {
    categories: categories.map(c => c.category),
    cities: cities.map(c => c.city),
  };
}

export async function createEvent(data: {
  title: string;
  category: string;
  city: string;
  startsAt: Date;
  price: number;
  description: string;
  imageUrl: string;
}) {
  const event = await prisma.event.create({
    data: {
      ...data,
      city: normalizeCity(data.city),
    },
  });
  return event;
}

export async function toggleEventStatus(id: string, isActive: boolean) {
  const event = await prisma.event.update({
    where: { id },
    data: { isActive },
  });
  return event;
}

export async function listAllEventsAdmin(page = 1, pageSize = 10) {
  const skip = (page - 1) * pageSize;
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.event.count(),
  ]);

  return {
    items: events.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      city: e.city,
      startsAt: e.startsAt.toISOString(),
      price: e.price,
      description: e.description,
      imageUrl: e.imageUrl,
      isActive: e.isActive,
      isPast: e.startsAt < new Date(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}