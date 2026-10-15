import { afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const testDbPath = './test.db';
process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = 'dev-secret-key-at-least-32-characters-long-for-testing';
process.env.ADMIN_EMAIL = 'admin@events.local';
process.env.ADMIN_PASSWORD = 'change-me-admin';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.reminder.deleteMany();
  await prisma.cardDesign.deleteMany();
  await prisma.favouriteCategory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  await prisma.user.create({
    data: {
      id: 'user1',
      email: 'user@test.com',
      passwordHash: await hash('password123', 10),
    },
  });
  await prisma.user.create({
    data: {
      id: 'user2',
      email: 'other@test.com',
      passwordHash: await hash('password123', 10),
    },
  });
});

vi.mock('@/lib/db', () => ({
  prisma,
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
