import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAuthenticatedRequest } from '../helpers';
import { GET as feedGET } from '@/app/api/me/feed/route';
import { GET as favouritesGET, PUT as favouritesPUT } from '@/app/api/me/favourites/route';

describe('Favourites and Feed', () => {
  let userToken: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');
    await prisma.event.deleteMany();
    await prisma.favouriteCategory.deleteMany();

    const tomorrow = new Date(Date.now() + 86400000);
    await prisma.event.createMany({
      data: [
        { title: 'Music Event', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Music event', imageUrl: 'https://example.com/1.jpg', isActive: true },
        { title: 'Food Event', category: 'Food', city: 'Coimbatore', startsAt: tomorrow, price: 0, description: 'Food event', imageUrl: 'https://example.com/2.jpg', isActive: true },
        { title: 'Sports Event', category: 'Sports', city: 'Chennai', startsAt: tomorrow, price: 350, description: 'Sports event', imageUrl: 'https://example.com/3.jpg', isActive: true },
      ],
    });
  });

  it('EC-V1: new user with no favourites gets empty feed with message', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/me/feed', userToken);
    const res = await feedGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.favouriteCategories).toEqual([]);
  });

  it('EC-V2: favourites set but no events returns different message', async () => {
    await favouritesPUT(createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Workshop'] }) }));

    const req = createAuthenticatedRequest('http://localhost/api/me/feed', userToken);
    const res = await feedGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.favouriteCategories).toEqual(['Workshop']);
  });

  it('EC-V3: empty array rejected', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: [] }) });
    const res = await favouritesPUT(req);
    expect(res.status).toBe(400);
  });

  it('EC-V3: unknown category rejected', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Invalid'] }) });
    const res = await favouritesPUT(req);
    expect(res.status).toBe(400);
  });

  it('EC-V3: more than 5 categories rejected', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Music', 'Food', 'Sports', 'Kids', 'Workshop', 'Dance'] }) });
    const res = await favouritesPUT(req);
    expect(res.status).toBe(400);
  });

  it('EC-V4: duplicates are deduplicated', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Music', 'Music', 'Food'] }) });
    const res = await favouritesPUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.categories).toEqual(['Music', 'Food']);
  });

  it('EC-V5: replace is atomic', async () => {
    await favouritesPUT(createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Music'] }) }));

    const req = createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Food', 'Sports'] }) });
    const res = await favouritesPUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.categories).toEqual(['Food', 'Sports']);
  });

  it('EC-V6: feed only shows favourite categories', async () => {
    await favouritesPUT(createAuthenticatedRequest('http://localhost/api/me/favourites', userToken, { method: 'PUT', body: JSON.stringify({ categories: ['Music', 'Food'] }) }));

    const req = createAuthenticatedRequest('http://localhost/api/me/feed', userToken);
    const res = await feedGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    data.items.forEach((e: any) => {
      expect(['Music', 'Food']).toContain(e.category);
    });
  });
});