import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAuthenticatedRequest } from '../helpers';
import { PUT as reminderPUT, DELETE as reminderDELETE } from '@/app/api/events/[id]/reminder/route';

describe('Reminders', () => {
  let userToken: string;
  let otherUserToken: string;
  let eventId: string;
  let pastEventId: string;
  let inactiveEventId: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');
    otherUserToken = await createUserToken('user2', 'other@test.com');

    const tomorrow = new Date(Date.now() + 86400000);
    const yesterday = new Date(Date.now() - 86400000);

    const [event, pastEvent, inactiveEvent] = await Promise.all([
      prisma.event.create({
        data: { title: 'Active Event', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Active', imageUrl: 'https://example.com/1.jpg', isActive: true },
      }),
      prisma.event.create({
        data: { title: 'Past Event', category: 'Music', city: 'Coimbatore', startsAt: yesterday, price: 499, description: 'Past', imageUrl: 'https://example.com/2.jpg', isActive: true },
      }),
      prisma.event.create({
        data: { title: 'Inactive Event', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Inactive', imageUrl: 'https://example.com/3.jpg', isActive: false },
      }),
    ]);

    eventId = event.id;
    pastEventId = pastEvent.id;
    inactiveEventId = inactiveEvent.id;
  });

  it('EC-R7: PUT twice is idempotent', async () => {
    const req1 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'PUT' });
    const res1 = await reminderPUT(req1, { params: Promise.resolve({ id: eventId }) });
    expect(res1.status).toBe(200);

    const req2 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'PUT' });
    const res2 = await reminderPUT(req2, { params: Promise.resolve({ id: eventId }) });
    expect(res2.status).toBe(200);

    const data = await res2.json();
    expect(data.isReminded).toBe(true);
  });

  it('EC-R7: DELETE twice is idempotent', async () => {
    await reminderPUT(createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'PUT' }), { params: Promise.resolve({ id: eventId }) });

    const req1 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'DELETE' });
    const res1 = await reminderDELETE(req1, { params: Promise.resolve({ id: eventId }) });
    expect(res1.status).toBe(200);

    const req2 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'DELETE' });
    const res2 = await reminderDELETE(req2, { params: Promise.resolve({ id: eventId }) });
    expect(res2.status).toBe(200);
  });

  it('EC-R8: PUT on inactive returns 404', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${inactiveEventId}/reminder`, userToken, { method: 'PUT' });
    const res = await reminderPUT(req, { params: Promise.resolve({ id: inactiveEventId }) });
    expect(res.status).toBe(404);
  });

  it('EC-R9: PUT on past returns 409', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${pastEventId}/reminder`, userToken, { method: 'PUT' });
    const res = await reminderPUT(req, { params: Promise.resolve({ id: pastEventId }) });
    expect(res.status).toBe(409);
  });

  it('EC-R10: reminder persists but event hidden when inactive', async () => {
    await reminderPUT(createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'PUT' }), { params: Promise.resolve({ id: eventId }) });

    await prisma.event.update({ where: { id: eventId }, data: { isActive: false } });

    const listReq = createAuthenticatedRequest('http://localhost/api/events', userToken);
    const { GET: eventsListGET } = await import('@/app/api/events/route');
    const listRes = await eventsListGET(listReq);
    const listData = await listRes.json();

    expect(listData.items.find((e: any) => e.id === eventId)).toBeUndefined();
  });

  it('user isolation: user B unaffected by user A reminder', async () => {
    await reminderPUT(createAuthenticatedRequest(`http://localhost/api/events/${eventId}/reminder`, userToken, { method: 'PUT' }), { params: Promise.resolve({ id: eventId }) });

    const req = createAuthenticatedRequest('http://localhost/api/events', otherUserToken);
    const { GET: eventsListGET } = await import('@/app/api/events/route');
    const res = await eventsListGET(req);
    const data = await res.json();

    const event = data.items.find((e: any) => e.id === eventId);
    expect(event?.isReminded).toBe(false);
  });
});