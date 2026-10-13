export const dynamic = 'force-dynamic';

import { withErrors, readJson, json } from '@/lib/http';
import { cardDesignSchema } from '@/lib/validation';
import { requireUserSession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const GET = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireUserSession(req);
  
  const design = await prisma.cardDesign.findUnique({
    where: { userId_eventId: { userId: session.sub, eventId: id } },
  });
  
  if (!design) {
    return json({ theme: 'sunset', stickers: [] });
  }
  
  let stickers: string[] = [];
  try {
    stickers = JSON.parse(design.stickers);
  } catch {
    stickers = [];
  }
  
  return json({ theme: design.theme, stickers });
});

export const PUT = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await requireUserSession(req);
  
  const input = cardDesignSchema.parse(await readJson(req));
  
  await prisma.cardDesign.upsert({
    where: { userId_eventId: { userId: session.sub, eventId: id } },
    create: { userId: session.sub, eventId: id, theme: input.theme, stickers: JSON.stringify(input.stickers) },
    update: { theme: input.theme, stickers: JSON.stringify(input.stickers) },
  });
  
  return json({ theme: input.theme, stickers: input.stickers });
});