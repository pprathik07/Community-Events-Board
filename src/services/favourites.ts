import { prisma } from '@/lib/db';
import { CATEGORIES } from '@/lib/constants';
import { HttpError } from '@/lib/http';

export async function getFavourites(userId: string): Promise<string[]> {
  const favs = await prisma.favouriteCategory.findMany({
    where: { userId },
    select: { category: true },
  });
  return favs.map(f => f.category);
}

export async function setFavourites(userId: string, categories: string[]): Promise<string[]> {
  const uniqueCategories = [...new Set(categories)].filter(c => (CATEGORIES as readonly string[]).includes(c));

  if (uniqueCategories.length === 0 || uniqueCategories.length > 5) {
    throw new HttpError(400, 'Invalid favourites');
  }

  await prisma.$transaction(async (tx) => {
    await tx.favouriteCategory.deleteMany({ where: { userId } });
    await tx.favouriteCategory.createMany({
      data: uniqueCategories.map(category => ({ userId, category })),
    });
  });

  return uniqueCategories;
}