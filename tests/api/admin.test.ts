import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createAdminToken, createAuthenticatedRequest } from '../helpers';
import { GET as adminEventsGET, POST as adminEventsPOST } from '@/app/api/admin/events/route';
import { PATCH as adminStatusPATCH } from '@/app/api/admin/events/[id]/status/route';

describe('Admin events', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await createAdminToken();
    await prisma.event.deleteMany();
  });

  it('EC-AD1: toggle is idempotent', async () => {
    const event = await prisma.event.create({
      data: { title: 'Test Event', category: 'Music', city: 'Coimbatore', startsAt: new Date(Date.now() + 86400000), price: 499, description: 'Test', imageUrl: 'https://example.com/1.jpg', isActive: true },
    });

    const req1 = createAuthenticatedRequest(`http://localhost/api/admin/events/${event.id}/status`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res1 = await adminStatusPATCH(req1, { params: Promise.resolve({ id: event.id }) });
    expect(res1.status).toBe(200);

    const req2 = createAuthenticatedRequest(`http://localhost/api/admin/events/${event.id}/status`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const res2 = await adminStatusPATCH(req2, { params: Promise.resolve({ id: event.id }) });
    expect(res2.status).toBe(200);

    const data = await res2.json();
    expect(data.event.isActive).toBe(false);
  });

  it('EC-AD4: admin list shows all events including inactive and past', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    await prisma.event.createMany({
      data: [
        { title: 'Active Future', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Test', imageUrl: 'https://example.com/1.jpg', isActive: true },
        { title: 'Inactive Future', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Test', imageUrl: 'https://example.com/2.jpg', isActive: false },
        { title: 'Active Past', category: 'Music', city: 'Coimbatore', startsAt: yesterday, price: 499, description: 'Test', imageUrl: 'https://example.com/3.jpg', isActive: true },
        { title: 'Inactive Past', category: 'Music', city: 'Coimbatore', startsAt: yesterday, price: 499, description: 'Test', imageUrl: 'https://example.com/4.jpg', isActive: false },
      ],
    });

    const req = createAuthenticatedRequest('http://localhost/api/admin/events', adminToken);
    const res = await adminEventsGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.total).toBe(4);
    expect(data.items.length).toBe(4);
  });

  it('EC-AD5: whitespace-only title rejected', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/admin/events', adminToken, {
      method: 'POST',
      body: JSON.stringify({ title: '   ', category: 'Music', city: 'Coimbatore', startsAt: new Date(Date.now() + 86400000).toISOString(), price: 0, description: 'Test description', imageUrl: 'https://example.com/img.jpg' }),
    });
    const res = await adminEventsPOST(req);
    expect(res.status).toBe(400);
  });

  it('EC-AD6: city normalization', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/admin/events', adminToken, {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Event', category: 'Music', city: ' coimbatore ', startsAt: new Date(Date.now() + 86400000).toISOString(), price: 0, description: 'Test description', imageUrl: 'https://example.com/img.jpg' }),
    });
    const res = await adminEventsPOST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.event.city).toBe('Coimbatore');
  });

  it('EC-AD11: past-dated event allowed', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/admin/events', adminToken, {
      method: 'POST',
      body: JSON.stringify({ title: 'Past Event', category: 'Music', city: 'Coimbatore', startsAt: new Date(Date.now() - 86400000).toISOString(), price: 0, description: 'Past event description', imageUrl: 'https://example.com/img.jpg' }),
    });
    const res = await adminEventsPOST(req);
    expect(res.status).toBe(201);
  });
});