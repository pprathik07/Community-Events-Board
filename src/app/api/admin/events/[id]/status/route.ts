export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { updateEventStatusSchema } from '@/lib/validation';
import { requireAdminSession } from '@/lib/session';
import { toggleEventStatus } from '@/services/events';

export const PATCH = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await requireAdminSession(req);
  
  const input = updateEventStatusSchema.parse(await readJson(req));
  
  const event = await toggleEventStatus(id, input.isActive);
  return json({ event });
});