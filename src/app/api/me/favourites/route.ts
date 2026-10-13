export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { favouritesSchema } from '@/lib/validation';
import { requireUserSession } from '@/lib/session';
import { getFavourites, setFavourites } from '@/services/favourites';

export const GET = withErrors(async (req: Request) => {
  const session = await requireUserSession(req);
  
  const categories = await getFavourites(session.sub);
  return json({ categories });
});

export const PUT = withErrors(async (req: Request) => {
  const session = await requireUserSession(req);
  
  const input = favouritesSchema.parse(await readJson(req));
  const categories = await setFavourites(session.sub, input.categories);
  return json({ categories });
});