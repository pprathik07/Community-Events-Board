export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { signupSchema, loginSchema } from '@/lib/validation';
import { signup, login } from '@/services/auth';
import { setAuthCookie, clearAuthCookie } from '@/lib/cookies';
import { getSessionFromRequest } from '@/lib/jwt';

export const POST = withErrors(async (req: Request) => {
  const input = signupSchema.parse(await readJson(req));
  const { token, user } = await signup(input.email, input.password);
  
  const response = json({ token, user }, 201);
  response.headers.set('Set-Cookie', await setAuthCookie(token));
  return response;
});