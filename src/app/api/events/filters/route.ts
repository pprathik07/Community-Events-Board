export const dynamic = 'force-dynamic';

import { withErrors, json } from '@/lib/http';
import { getFilters } from '@/services/events';

export const GET = withErrors(async () => {
  const result = await getFilters();
  return json(result);
});