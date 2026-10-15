import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createUserToken, createAdminToken, createAuthenticatedRequest, createCookieRequest, createRequest } from '../helpers';
import { GET as eventsListGET } from '@/app/api/events/route';
import { GET as eventsFiltersGET } from '@/app/api/events/filters/route';
import { GET as eventDetailGET } from '@/app/api/events/[id]/route';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { GET as meGET } from '@/app/api/auth/me/route';
import { GET as favouritesGET, PUT as favouritesPUT } from '@/app/api/me/favourites/route';
import { GET as feedGET } from '@/app/api/me/feed/route';
import { PUT as reminderPUT, DELETE as reminderDELETE } from '@/app/api/events/[id]/reminder/route';
import { GET as cardGET, PUT as cardPUT } from '@/app/api/events/[id]/card/route';
import { GET as adminEventsGET, POST as adminEventsPOST } from '@/app/api/admin/events/route';
import { PATCH as adminStatusPATCH } from '@/app/api/admin/events/[id]/status/route';

const AUTH_MATRIX = [
  { route: 'POST /api/auth/signup', methods: ['POST'], anonymous: 201, user: 201, admin: 201 },
  { route: 'POST /api/auth/login', methods: ['POST'], anonymous: 200, user: 200, admin: 200 },
  { route: 'POST /api/auth/logout', methods: ['POST'], anonymous: 200, user: 200, admin: 200 },
  { route: 'GET /api/auth/me', methods: ['GET'], anonymous: 401, user: 200, admin: 200 },
  { route: 'GET /api/events', methods: ['GET'], anonymous: 200, user: 200, admin: 200 },
  { route: 'GET /api/events/filters', methods: ['GET'], anonymous: 200, user: 200, admin: 200 },
  { route: 'GET /api/events/:id', methods: ['GET'], anonymous: 200, user: 200, admin: 200 },
  { route: 'GET /api/me/favourites', methods: ['GET'], anonymous: 401, user: 200, admin: 403 },
  { route: 'PUT /api/me/favourites', methods: ['PUT'], anonymous: 401, user: 200, admin: 403 },
  { route: 'GET /api/me/feed', methods: ['GET'], anonymous: 401, user: 200, admin: 403 },
  { route: 'PUT /api/events/:id/reminder', methods: ['PUT'], anonymous: 401, user: 200, admin: 403 },
  { route: 'DELETE /api/events/:id/reminder', methods: ['DELETE'], anonymous: 401, user: 200, admin: 403 },
  { route: 'GET /api/events/:id/card', methods: ['GET'], anonymous: 401, user: 200, admin: 403 },
  { route: 'PUT /api/events/:id/card', methods: ['PUT'], anonymous: 401, user: 200, admin: 403 },
  { route: 'GET /api/admin/events', methods: ['GET'], anonymous: 401, user: 403, admin: 200 },
  { route: 'POST /api/admin/events', methods: ['POST'], anonymous: 401, user: 403, admin: 201 },
  { route: 'PATCH /api/admin/events/:id/status', methods: ['PATCH'], anonymous: 401, user: 403, admin: 200 },
];

describe('Authorization matrix', () => {
  let userToken: string;
  let adminToken: string;
  let eventId: string;

  beforeEach(async () => {
    userToken = await createUserToken('user1', 'user@test.com');
    adminToken = await createAdminToken();

    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        category: 'Music',
        city: 'Coimbatore',
        startsAt: new Date(Date.now() + 86400000),
        price: 499,
        description: 'Test event description',
        imageUrl: 'https://example.com/image.jpg',
        isActive: true,
      },
    });
    eventId = event.id;
  });

  AUTH_MATRIX.forEach(({ route, methods, anonymous, user, admin }) => {
    methods.forEach(method => {
      it(`${method} ${route} - anonymous: ${anonymous}, user: ${user}, admin: ${admin}`, async () => {
        let url = '';
        let handler: any;
        let baseOptions: RequestInit = {};

        switch (route) {
          case 'POST /api/auth/signup':
            handler = signupPOST;
            url = 'http://localhost/api/auth/signup';
            break;
          case 'POST /api/auth/login':
            handler = loginPOST;
            url = 'http://localhost/api/auth/login';
            baseOptions = { method: 'POST', body: JSON.stringify({ email: 'user@test.com', password: 'password123' }) };
            break;
          case 'POST /api/auth/logout':
            handler = logoutPOST;
            url = 'http://localhost/api/auth/logout';
            baseOptions = { method: 'POST' };
            break;
          case 'GET /api/auth/me':
            handler = meGET;
            url = 'http://localhost/api/auth/me';
            break;
          case 'GET /api/events':
            handler = eventsListGET;
            url = 'http://localhost/api/events';
            break;
          case 'GET /api/events/filters':
            handler = eventsFiltersGET;
            url = 'http://localhost/api/events/filters';
            break;
          case 'GET /api/events/:id':
            handler = async (req: Request) => eventDetailGET(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/events/${eventId}`;
            break;
          case 'GET /api/me/favourites':
            handler = favouritesGET;
            url = 'http://localhost/api/me/favourites';
            break;
          case 'PUT /api/me/favourites':
            handler = favouritesPUT;
            url = 'http://localhost/api/me/favourites';
            baseOptions = { method: 'PUT', body: JSON.stringify({ categories: ['Music'] }) };
            break;
          case 'GET /api/me/feed':
            handler = feedGET;
            url = 'http://localhost/api/me/feed';
            break;
          case 'PUT /api/events/:id/reminder':
            handler = async (req: Request) => reminderPUT(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/events/${eventId}/reminder`;
            baseOptions = { method: 'PUT' };
            break;
          case 'DELETE /api/events/:id/reminder':
            handler = async (req: Request) => reminderDELETE(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/events/${eventId}/reminder`;
            baseOptions = { method: 'DELETE' };
            break;
          case 'GET /api/events/:id/card':
            handler = async (req: Request) => cardGET(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/events/${eventId}/card`;
            break;
          case 'PUT /api/events/:id/card':
            handler = async (req: Request) => cardPUT(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/events/${eventId}/card`;
            baseOptions = { method: 'PUT', body: JSON.stringify({ theme: 'sunset', stickers: [] }) };
            break;
          case 'GET /api/admin/events':
            handler = adminEventsGET;
            url = 'http://localhost/api/admin/events';
            break;
          case 'POST /api/admin/events':
            handler = adminEventsPOST;
            url = 'http://localhost/api/admin/events';
            baseOptions = { method: 'POST', body: JSON.stringify({ title: 'Admin Event', category: 'Music', city: 'Coimbatore', startsAt: new Date(Date.now() + 86400000).toISOString(), price: 0, description: 'Admin event', imageUrl: 'https://example.com/img.jpg' }) };
            break;
          case 'PATCH /api/admin/events/:id/status':
            handler = async (req: Request) => adminStatusPATCH(req, { params: Promise.resolve({ id: eventId }) });
            url = `http://localhost/api/admin/events/${eventId}/status`;
            baseOptions = { method: 'PATCH', body: JSON.stringify({ isActive: false }) };
            break;
        }

        // Each role gets a *fresh* Request: a body stream can only be read once,
        // and signup needs a new email per attempt (otherwise the 2nd and 3rd
        // attempts would 409 instead of the 201 the matrix expects).
        const optionsFor = (role: string): RequestInit =>
          route === 'POST /api/auth/signup'
            ? {
                method: 'POST',
                body: JSON.stringify({ email: `authz-${role}-${Date.now()}@test.com`, password: 'password123' }),
              }
            : baseOptions;

        // Test anonymous
        const anonRes = await handler(createRequest(url, optionsFor('anon')));
        expect(anonRes.status).toBe(anonymous);

        // Test user
        const userRes = await handler(createAuthenticatedRequest(url, userToken, optionsFor('user')));
        expect(userRes.status).toBe(user);

        // Test admin
        const adminRes = await handler(createAuthenticatedRequest(url, adminToken, optionsFor('admin')));
        expect(adminRes.status).toBe(admin);
      });
    });
  });
});