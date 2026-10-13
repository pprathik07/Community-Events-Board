export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { createEventSchema, adminPageSchema } from '@/lib/validation';
import { requireAdminSession } from '@/lib/session';
import { createEvent, listAllEventsAdmin } from '@/services/events';

export const GET = withErrors(async (req: Request) => {
  await requireAdminSession(req);
  
  const url = new URL(req.url);
  const input = adminPageSchema.parse(Object.fromEntries(url.searchParams.entries()));
  
  const result = await listAllEventsAdmin(input.page);
  return json(result);
});

export const POST = withErrors(async (req: Request) => {
  const session = await requireAdminSession(req);
  
  const input = createEventSchema.parse(await readJson(req));
  
  const startsAt = new Date(input.startsAt);
  
  const event = await createEvent({ ...input, startsAt });
  return json({ event }, 201);
});