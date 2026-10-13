export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { requireUserSession } from '@/lib/session';
import { setReminder, unsetReminder } from '@/services/reminders';

export const PUT = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireUserSession(req);
  
  const result = await setReminder(session.sub, id);
  return json(result);
});

export const DELETE = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireUserSession(req);
  
  const result = await unsetReminder(session.sub, id);
  return json(result);
});