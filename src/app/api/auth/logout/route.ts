export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { clearAuthCookie } from '@/lib/cookies';

export const POST = withErrors(async () => {
  const response = json({ ok: true });
  response.headers.set('Set-Cookie', await clearAuthCookie());
  return response;
});