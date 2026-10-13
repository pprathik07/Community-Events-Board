export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { requireUserSession } from '@/lib/session';
import { getFeed } from '@/services/feed';

export const GET = withErrors(async (req: Request) => {
  const session = await requireUserSession(req);
  
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  
  const result = await getFeed(session.sub, page);
  return json(result);
});