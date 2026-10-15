import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAuthenticatedRequest } from '../helpers';
import { GET as eventsListGET } from '@/app/api/events/route';

describe('Events list - filters and pagination', () => {
  let userToken: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');

    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 2 * 86400000);

    await prisma.event.createMany({
      data: [
        { title: 'Music Night Coimbatore', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Music night in Coimbatore', imageUrl: 'https://example.com/1.jpg', isActive: true },
        { title: 'Music Night Coimbatore 2', category: 'Music', city: 'Coimbatore', startsAt: dayAfter, price: 750, description: 'Another music night', imageUrl: 'https://example.com/2.jpg', isActive: true },
        { title: 'Workshop Chennai', category: 'Workshop', city: 'Chennai', startsAt: tomorrow, price: 1200, description: 'Workshop in Chennai', imageUrl: 'https://example.com/3.jpg', isActive: true },
        { title: 'Food Fair Hyderabad', category: 'Food', city: 'Hyderabad', startsAt: tomorrow, price: 0, description: 'Food fair', imageUrl: 'https://example.com/4.jpg', isActive: true },
      ],
    });
  });

  it('EC-F2: Music + Coimbatore + night returns 2 events', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events?category=Music&city=Coimbatore&q=night', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    expect(data.total).toBe(2);
    expect(data.items.length).toBe(2);
    data.items.forEach((e: any) => {
      expect(e.category).toBe('Music');
      expect(e.city).toBe('Coimbatore');
      expect(e.title.toLowerCase()).toContain('night');
    });
  });

  it('EC-F3: single filter works', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events?category=Music', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    expect(data.total).toBe(2);
    data.items.forEach((e: any) => expect(e.category).toBe('Music'));
  });

  it('EC-F3: city filter works', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events?city=Chennai', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    expect(data.total).toBe(1);
    expect(data.items[0].city).toBe('Chennai');
  });

  it('EC-F6: search is case-insensitive', async () => {
    const req1 = createAuthenticatedRequest('http://localhost/api/events?q=NIGHT', userToken);
    const res1 = await eventsListGET(req1);
    const data1 = await res1.json();

    const req2 = createAuthenticatedRequest('http://localhost/api/events?q=night', userToken);
    const res2 = await eventsListGET(req2);
    const data2 = await res2.json();

    expect(data1.total).toBe(data2.total);
    expect(data1.items.map((e: any) => e.id).sort()).toEqual(data2.items.map((e: any) => e.id).sort());
  });

  it('EC-F7: city filter normalizes case', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events?city=coimbatore', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    expect(data.total).toBe(2);
  });

  it('EC-F8: unknown category returns 400', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/events?category=Dance', userToken);
    const res = await eventsListGET(req);
    expect(res.status).toBe(400);
  });

  it('EC-F4: empty q treated as no search', async () => {
    const req1 = createAuthenticatedRequest('http://localhost/api/events?q=', userToken);
    const res1 = await eventsListGET(req1);
    const data1 = await res1.json();

    const req2 = createAuthenticatedRequest('http://localhost/api/events', userToken);
    const res2 = await eventsListGET(req2);
    const data2 = await res2.json();

    expect(data1.total).toBe(data2.total);
  });

  it('EC-F5: search treats special chars as literal', async () => {
    await prisma.event.create({
      data: { title: 'Test % Event', category: 'Music', city: 'Coimbatore', startsAt: new Date(Date.now() + 86400000), price: 100, description: 'Test event with percent', imageUrl: 'https://example.com/test.jpg', isActive: true },
    });

    const req = createAuthenticatedRequest('http://localhost/api/events?q=%', userToken);
    const res = await eventsListGET(req);
    const data = await res.json();

    expect(data.total).toBe(1);
    expect(data.items[0].title).toBe('Test % Event');
  });

  describe('EC-P1 to EC-P7: Pagination', () => {
    beforeEach(async () => {
      // The pagination fixture assumes exactly 9 events (6 + 3 over two pages),
      // so drop the 4 events the outer fixture created first.
      await prisma.event.deleteMany();
      const tomorrow = new Date(Date.now() + 86400000);
      const events = Array.from({ length: 9 }, (_, i) => ({
        title: `Event ${i}`,
        category: 'Music',
        city: 'Coimbatore',
        startsAt: new Date(tomorrow.getTime() + i * 60000),
        price: 100,
        description: `Description ${i}`,
        imageUrl: `https://example.com/${i}.jpg`,
        isActive: true,
      }));
      await prisma.event.createMany({ data: events });
    });

    it('EC-P1: tiebreaker by id for same timestamp', async () => {
      const req1 = createAuthenticatedRequest('http://localhost/api/events?page=1&pageSize=6', userToken);
      const res1 = await eventsListGET(req1);
      const data1 = await res1.json();

      const req2 = createAuthenticatedRequest('http://localhost/api/events?page=2&pageSize=6', userToken);
      const res2 = await eventsListGET(req2);
      const data2 = await res2.json();

      const allIds = [...data1.items, ...data2.items].map((e: any) => e.id);
      expect(new Set(allIds).size).toBe(allIds.length);
    });

    it('EC-P2: page beyond last returns empty', async () => {
      const req = createAuthenticatedRequest('http://localhost/api/events?page=100', userToken);
      const res = await eventsListGET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.total).toBeGreaterThan(0);
    });

    it('EC-P3: invalid page returns 400', async () => {
      const req = createAuthenticatedRequest('http://localhost/api/events?page=0', userToken);
      const res = await eventsListGET(req);
      expect(res.status).toBe(400);
    });

    it('EC-P3: invalid pageSize returns 400', async () => {
      const req = createAuthenticatedRequest('http://localhost/api/events?pageSize=100', userToken);
      const res = await eventsListGET(req);
      expect(res.status).toBe(400);
    });

    it('EC-P5: seed data gives 6 + 3 over two pages', async () => {
      const req1 = createAuthenticatedRequest('http://localhost/api/events?page=1&pageSize=6', userToken);
      const res1 = await eventsListGET(req1);
      const data1 = await res1.json();

      const req2 = createAuthenticatedRequest('http://localhost/api/events?page=2&pageSize=6', userToken);
      const res2 = await eventsListGET(req2);
      const data2 = await res2.json();

      expect(data1.items.length).toBe(6);
      expect(data2.items.length).toBe(3);
    });
  });
});