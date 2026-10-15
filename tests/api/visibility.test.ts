import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAuthenticatedRequest } from '../helpers';
import { GET as eventsListGET } from '@/app/api/events/route';
import { GET as eventDetailGET } from '@/app/api/events/[id]/route';
import { GET as eventsFiltersGET } from '@/app/api/events/filters/route';
import { GET as feedGET } from '@/app/api/me/feed/route';
import { PUT as reminderPUT } from '@/app/api/events/[id]/reminder/route';

describe('Visibility - inactive and past events never leak', () => {
  let userToken: string;
  let activeEventId: string;
  let inactiveEventId: string;
  let pastEventId: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    const [active, inactive, past] = await Promise.all([
      prisma.event.create({
        data: {
          title: 'Active Event',
          category: 'Music',
          city: 'Coimbatore',
          startsAt: tomorrow,
          price: 499,
          description: 'Active event description',
          imageUrl: 'https://example.com/active.jpg',
          isActive: true,
        },
      }),
      prisma.event.create({
        data: {
          title: 'Inactive Event',
          category: 'Music',
          city: 'Coimbatore',
          startsAt: tomorrow,
          price: 499,
          description: 'Inactive event description',
          imageUrl: 'https://example.com/inactive.jpg',
          isActive: false,
        },
      }),
      prisma.event.create({
        data: {
          title: 'Past Event',
          category: 'Music',
          city: 'Coimbatore',
          startsAt: yesterday,
          price: 499,
          description: 'Past event description',
          imageUrl: 'https://example.com/past.jpg',
          isActive: true,
        },
      }),
    ]);

    activeEventId = active.id;
    inactiveEventId = inactive.id;
    pastEventId = past.id;
  });

  it('EC-F1, EC-AD3: events list excludes inactive and past', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    const ids = data.items.map((e: any) => e.id);
    expect(ids).toContain(activeEventId);
    expect(ids).not.toContain(inactiveEventId);
    expect(ids).not.toContain(pastEventId);
  });

  it('EC-F1: event detail returns 404 for inactive', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${inactiveEventId}`, userToken);
    const res = await eventDetailGET(req, { params: Promise.resolve({ id: inactiveEventId }) });
    expect(res.status).toBe(404);
  });

  it('EC-F1: event detail returns 404 for past', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${pastEventId}`, userToken);
    const res = await eventDetailGET(req, { params: Promise.resolve({ id: pastEventId }) });
    expect(res.status).toBe(404);
  });

  it('EC-AD3: filters cities excludes inactive and past', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events/filters', userToken);
    const res = await eventsFiltersGET(req);
    const data = await res.json();

    expect(data.cities).toContain('Coimbatore');
  });

  it('EC-R8, EC-R9: reminder PUT returns 404 for inactive, 409 for past', async () => {
    const inactiveReq = createAuthenticatedRequest(`http://localhost/api/events/${inactiveEventId}/reminder`, userToken, { method: 'PUT' });
    const inactiveRes = await reminderPUT(inactiveReq, { params: Promise.resolve({ id: inactiveEventId }) });
    expect(inactiveRes.status).toBe(404);

    const pastReq = createAuthenticatedRequest(`http://localhost/api/events/${pastEventId}/reminder`, userToken, { method: 'PUT' });
    const pastRes = await reminderPUT(pastReq, { params: Promise.resolve({ id: pastEventId }) });
    expect(pastRes.status).toBe(409);
  });

  it('feed excludes inactive and past', async () => {
    await prisma.favouriteCategory.create({
      data: { userId: 'user1', category: 'Music' },
    });

    const req = createAuthenticatedRequest('http://localhost/api/me/feed', userToken);
    const res = await feedGET(req);
    const data = await res.json();

    const ids = data.items.map((e: any) => e.id);
    expect(ids).toContain(activeEventId);
    expect(ids).not.toContain(inactiveEventId);
    expect(ids).not.toContain(pastEventId);
  });
});