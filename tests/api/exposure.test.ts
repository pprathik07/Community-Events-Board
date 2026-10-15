import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAdminToken, createAuthenticatedRequest } from '../helpers';
import { GET as eventsListGET } from '@/app/api/events/route';
import { GET as adminEventsGET } from '@/app/api/admin/events/route';
import { GET as meGET } from '@/app/api/auth/me/route';
import { GET as eventDetailGET } from '@/app/api/events/[id]/route';

describe('Data exposure', () => {
  let userToken: string;
  let adminToken: string;
  let eventId: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');
    adminToken = await createAdminToken();

    const tomorrow = new Date(Date.now() + 86400000);
    const event = await prisma.event.create({
      data: { title: 'Test Event', category: 'Music', city: 'Coimbatore', startsAt: tomorrow, price: 499, description: 'Test', imageUrl: 'https://example.com/1.jpg', isActive: true },
    });
    eventId = event.id;
  });

  it('no response contains passwordHash', async () => {
    const endpoints = [
      { req: createAuthenticatedRequest('http://localhost/api/events', userToken), handler: eventsListGET },
      { req: createAuthenticatedRequest(`http://localhost/api/events/${eventId}`, userToken), handler: (req: Request) => eventDetailGET(req, { params: Promise.resolve({ id: eventId }) }) },
      { req: createAuthenticatedRequest('http://localhost/api/auth/me', userToken), handler: meGET },
      { req: createAuthenticatedRequest('http://localhost/api/admin/events', adminToken), handler: adminEventsGET },
    ];

    for (const { req, handler } of endpoints) {
      const res = await handler(req);
      const text = await res.text();
      expect(text).not.toContain('passwordHash');
    }
  });

  it('isActive only in admin responses', async () => {
    const publicReq = createAuthenticatedRequest('http://localhost/api/events', userToken);
    const publicRes = await eventsListGET(publicReq);
    const publicData = await publicRes.json();

    publicData.items.forEach((e: any) => {
      expect(e).not.toHaveProperty('isActive');
    });

    const adminReq = createAuthenticatedRequest('http://localhost/api/admin/events', adminToken);
    const adminRes = await adminEventsGET(adminReq);
    const adminData = await adminRes.json();

    adminData.items.forEach((e: any) => {
      expect(e).toHaveProperty('isActive');
    });
  });
});