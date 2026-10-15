import { execSync } from 'node:child_process';

/**
 * Runs exactly once before the whole test run (not per file).
 *
 * Each test file previously ran `prisma migrate deploy` in its own `beforeAll`,
 * which raced across workers and timed out. Doing it once here keeps the schema
 * in place, then each file's `beforeEach` clears the data.
 *
 * SQLite resolves `file:./x.db` relative to the schema directory (prisma/), so
 * this produces prisma/test.db — the same file the runtime PrismaClient uses.
 */
export const TEST_DATABASE_URL = 'file:./test.db';

export default async function globalSetup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, CHECKPOINT_DISABLE: '1' },
  });
}
