export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { filtersSchema } from '@/lib/validation';
import { getSessionFromRequest } from '@/lib/jwt';
import { listEvents, getFilters } from '@/services/events';

export const GET = withErrors(async (req: Request) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const input = filtersSchema.parse(params);
  
  const session = await getSessionFromRequest(req);
  const userId = session?.role === 'user' ? session.sub : undefined;
  
  const result = await listEvents(input, userId);
  return json(result);
});