import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createRequest, createAuthenticatedRequest, createCookieRequest } from '../helpers';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as meGET } from '@/app/api/auth/me/route';

describe('Auth - signup and login', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('EC-A1: duplicate email (case insensitive) returns 409', async () => {
    const req1 = createRequest('http://localhost/api/auth/signup', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) });
    await signupPOST(req1);

    const req2 = createRequest('http://localhost/api/auth/signup', { method: 'POST', body: JSON.stringify({ email: 'TEST@EXAMPLE.COM', password: 'password123' }) });
    const res2 = await signupPOST(req2);

    expect(res2.status).toBe(409);
  });

  it('EC-A3: password < 8 chars returns 400', async () => {
    const req = createRequest('http://localhost/api/auth/signup', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'short' }) });
    const res = await signupPOST(req);
    expect(res.status).toBe(400);
  });

  it('EC-A3: password > 72 chars returns 400', async () => {
    const req = createRequest('http://localhost/api/auth/signup', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'a'.repeat(73) }) });
    const res = await signupPOST(req);
    expect(res.status).toBe(400);
  });

  it('EC-A4: wrong password and unknown email return identical error', async () => {
    await prisma.user.create({
      data: { email: 'existing@test.com', passwordHash: await (await import('bcryptjs')).hash('password123', 10) },
    });

    const wrongPasswordReq = createRequest('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'existing@test.com', password: 'wrong' }) });
    const wrongPasswordRes = await loginPOST(wrongPasswordReq);

    const unknownEmailReq = createRequest('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'unknown@test.com', password: 'password123' }) });
    const unknownEmailRes = await loginPOST(unknownEmailReq);

    expect(wrongPasswordRes.status).toBe(401);
    expect(unknownEmailRes.status).toBe(401);

    const wrongPasswordData = await wrongPasswordRes.json();
    const unknownEmailData = await unknownEmailRes.json();
    expect(wrongPasswordData.error.message).toBe(unknownEmailData.error.message);
  });
});

describe('Auth - token validation', () => {
  let userToken: string;

  beforeEach(async () => {
    const { createUserToken } = await import('../helpers');
    userToken = await createUserToken('user1', 'user@test.com');
  });

  it('EC-A5: expired token returns 401', async () => {
    const { createExpiredToken } = await import('../helpers');
    const expiredToken = await createExpiredToken();
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', expiredToken);
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it('EC-A5: tampered token returns 401', async () => {
    const { createTamperedToken } = await import('../helpers');
    const tamperedToken = await createTamperedToken();
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', tamperedToken);
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it('EC-A5: wrong secret token returns 401', async () => {
    const { createWrongSecretToken } = await import('../helpers');
    const wrongSecretToken = await createWrongSecretToken();
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', wrongSecretToken);
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it('EC-A6: valid token but missing user returns 401', async () => {
    // Signed correctly, but the user id was never created (user1 exists).
    const { createUserToken } = await import('../helpers');
    const ghostToken = await createUserToken('ghost-user-404', 'ghost@test.com');
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', ghostToken);
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });
});

describe('Auth - bearer vs cookie', () => {
  let userToken: string;

  beforeEach(async () => {
    const { createUserToken } = await import('../helpers');
    userToken = await createUserToken('user1', 'user@test.com');
  });

  it('EC-A11: bearer token works', async () => {
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', userToken);
    const res = await meGET(req);
    expect(res.status).toBe(200);
  });

  it('EC-A11: cookie token works', async () => {
    const req = createCookieRequest('http://localhost/api/auth/me', userToken);
    const res = await meGET(req);
    expect(res.status).toBe(200);
  });

  it('EC-A12: bearer wins when both present', async () => {
    const { createUserToken } = await import('../helpers');
    const otherToken = await createUserToken('user2', 'other@test.com');
    const req = createAuthenticatedRequest('http://localhost/api/auth/me', userToken);
    const cookieReq = new Request(req.url, {
      method: req.method,
      headers: new Headers(req.headers),
    });
    cookieReq.headers.set('Cookie', `ceb_token=${otherToken}`);
    
    const res = await meGET(cookieReq);
    const data = await res.json();
    expect(data.user.email).toBe('user@test.com');
  });
});