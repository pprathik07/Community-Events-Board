import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAuthenticatedRequest } from '../helpers';
import { GET as cardGET, PUT as cardPUT } from '@/app/api/events/[id]/card/route';

describe('Card design', () => {
  let userToken: string;
  let otherUserToken: string;
  let eventId: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');
    otherUserToken = await createUserToken('user2', 'other@test.com');

    const tomorrow = new Date(Date.now() + 86400000);
    const event = await prisma.event.create({
      data: { title: 'Test Event', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Test', imageUrl: 'https://example.com/1.jpg', isActive: true },
    });
    eventId = event.id;
  });

  it('EC-C1: 4 stickers rejected', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'sunset', stickers: ['music', 'party', 'food', 'star'] }),
    });
    const res = await cardPUT(req, { params: Promise.resolve({ id: eventId }) });
    expect(res.status).toBe(400);
  });

  it('EC-C3: unknown theme rejected', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'invalid', stickers: [] }),
    });
    const res = await cardPUT(req, { params: Promise.resolve({ id: eventId }) });
    expect(res.status).toBe(400);
  });

  it('EC-C3: unknown sticker id rejected', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'sunset', stickers: ['invalid'] }),
    });
    const res = await cardPUT(req, { params: Promise.resolve({ id: eventId }) });
    expect(res.status).toBe(400);
  });

  it('EC-C5: defaults when never designed', async () => {
    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken);
    const res = await cardGET(req, { params: Promise.resolve({ id: eventId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.theme).toBe('sunset');
    expect(data.stickers).toEqual([]);
  });

  it('EC-C10: corrupt stored JSON tolerated', async () => {
    await prisma.cardDesign.create({
      data: { userId: 'user1', eventId, theme: 'sunset', stickers: 'not-valid-json' },
    });

    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken);
    const res = await cardGET(req, { params: Promise.resolve({ id: eventId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stickers).toEqual([]);
  });

  it('EC-C11: different users have separate designs', async () => {
    await cardPUT(createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'ocean', stickers: ['music', 'star'] }),
    }), { params: Promise.resolve({ id: eventId }) });

    const req = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, otherUserToken);
    const res = await cardGET(req, { params: Promise.resolve({ id: eventId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.theme).toBe('sunset');
    expect(data.stickers).toEqual([]);
  });

  it('upsert works correctly', async () => {
    const req1 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'sunset', stickers: ['music'] }),
    });
    await cardPUT(req1, { params: Promise.resolve({ id: eventId }) });

    const req2 = createAuthenticatedRequest(`http://localhost/api/events/${eventId}/card`, userToken, {
      method: 'PUT',
      body: JSON.stringify({ theme: 'ocean', stickers: ['party', 'food'] }),
    });
    const res2 = await cardPUT(req2, { params: Promise.resolve({ id: eventId }) });
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.theme).toBe('ocean');
    expect(data2.stickers).toEqual(['party', 'food']);
  });
});