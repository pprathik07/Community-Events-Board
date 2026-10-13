export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { getSessionFromRequest } from '@/lib/jwt';
import { getEventById } from '@/services/events';

export const GET = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  const userId = session?.role === 'user' ? session.sub : undefined;
  
  const event = await getEventById(id, userId);
  if (!event) {
    return json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } }, 404);
  }
  
  return json(event);
});