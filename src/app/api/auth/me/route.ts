export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { getSessionFromRequest } from '@/lib/jwt';
import { getUser } from '@/services/auth';

export const GET = withErrors(async (req: Request) => {
  const session = await getSessionFromRequest(req);
  if (!session) throw new Error('UNAUTHENTICATED');

  // Admin sessions are valid without a user row.
  if (session.sub === 'admin') {
    return json({ user: { id: 'admin', email: session.email, role: 'admin' } });
  }

  // A well-formed token whose user has since been deleted must 401 (EC-A6).
  const user = await getUser(session.sub);
  if (!user) throw new Error('UNAUTHENTICATED');

  return json({ user: { id: user.id, email: user.email, role: session.role } });
});
