import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Caching headers', () => {
  const apiDir = join(process.cwd(), 'src/app/api');

  function getRouteFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getRouteFiles(fullPath));
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
    return files;
  }

  const routeFiles = getRouteFiles(apiDir);

  it('EC-S4: all GET handlers export dynamic = force-dynamic', () => {
    const getRoutes = routeFiles.filter(f => {
      const content = readFileSync(f, 'utf-8');
      return content.includes('export const GET') || content.includes('export async function GET');
    });

    const missingDynamic = getRoutes.filter(f => {
      const content = readFileSync(f, 'utf-8');
      return !content.includes('export const dynamic = "force-dynamic"') && !content.includes("export const dynamic = 'force-dynamic'");
    });

    expect(missingDynamic).toEqual([]);
  });

  it('EC-S5: user-specific GET handlers check authentication', () => {
    const userSpecificRoutes = routeFiles.filter(f => {
      const content = readFileSync(f, 'utf-8');
      return (content.includes('requireUser') || content.includes('getSession') || content.includes('getSessionFromRequest')) 
        && (content.includes('export const GET') || content.includes('export async function GET'));
    });

    // These routes should have authentication checks
    expect(userSpecificRoutes.length).toBeGreaterThan(0);
    
    // Each should have some form of auth check
    const missingAuth = userSpecificRoutes.filter(f => {
      const content = readFileSync(f, 'utf-8');
      return !content.includes('requireUser') && !content.includes('getSession') && !content.includes('getSessionFromRequest');
    });

    expect(missingAuth).toEqual([]);
  });
});