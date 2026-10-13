import { prisma } from '@/lib/db';
import { publicEventWhere } from './visibility';

export interface FeedEvent {
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

export interface FeedResponse {
  items: FeedEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  favouriteCategories: string[];
}

export async function getFeed(userId: string, page = 1, pageSize = 6): Promise<FeedResponse> {
  const now = new Date();
  const skip = (page - 1) * pageSize;

  const favourites = await prisma.favouriteCategory.findMany({
    where: { userId },
    select: { category: true },
  });
  const favouriteCategories = favourites.map(f => f.category);

  if (favouriteCategories.length === 0) {
    return {
      items: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0,
      favouriteCategories,
    };
  }

  const where = {
    ...publicEventWhere(now),
    category: { in: favouriteCategories },
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      skip,
      take: pageSize,
    }),
    prisma.event.count({ where }),
  ]);

  const reminders = await prisma.reminder.findMany({
    where: { userId, eventId: { in: events.map(e => e.id) } },
    select: { eventId: true },
  });
  const reminderSet = new Set(reminders.map(r => r.eventId));

  const items = events.map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    city: e.city,
    startsAt: e.startsAt.toISOString(),
    price: e.price,
    description: e.description,
    imageUrl: e.imageUrl,
    isReminded: reminderSet.has(e.id),
  }));

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    favouriteCategories,
  };
}