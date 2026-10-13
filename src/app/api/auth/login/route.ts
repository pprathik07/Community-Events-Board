export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { loginSchema } from '@/lib/validation';
import { login } from '@/services/auth';
import { setAuthCookie } from '@/lib/cookies';

export const POST = withErrors(async (req: Request) => {
  const input = loginSchema.parse(await readJson(req));
  const { token, user } = await login(input.email, input.password);
  
  const response = json({ token, user });
  response.headers.set('Set-Cookie', await setAuthCookie(token));
  return response;
});