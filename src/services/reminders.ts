import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/http';

export async function setReminder(userId: string, eventId: string) {
  const now = new Date();
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  // Missing or inactive events are hidden entirely -> 404.
  if (!event || !event.isActive) {
    throw new HttpError(404, 'Event not found');
  }

  // Past events are visible in the admin list but can no longer be reminded.
  if (event.startsAt <= now) {
    throw new HttpError(409, 'Event is no longer available');
  }

  await prisma.reminder.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });

  return { isReminded: true };
}

export async function unsetReminder(userId: string, eventId: string) {
  await prisma.reminder.deleteMany({
    where: { userId, eventId },
  });
  return { isReminded: false };
}
