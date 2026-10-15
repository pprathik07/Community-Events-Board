import { describe, it, expect } from 'vitest';
import { readdirSync } from 'fs';
import { join } from 'path';

describe('Route inventory', () => {
  const apiDir = join(process.cwd(), 'src/app/api');
  
  function getRoutes(dir: string, prefix = ''): string[] {
    const routes: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          const paramName = entry.name.slice(1, -1);
          routes.push(...getRoutes(fullPath, `${prefix}/:${paramName}`));
        } else {
          routes.push(...getRoutes(fullPath, `${prefix}/${entry.name}`));
        }
      } else if (entry.name === 'route.ts') {
        routes.push('/api' + prefix);
      }
    }
    return routes;
  }

  const routes = getRoutes(apiDir);
  
  // Normalize routes: replace :param with actual param names
  const normalizedRoutes = routes.map(r => r.replace(/\/:[^/]+/g, '/:param'));
  
  const knownRoutes = new Set([
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/events',
    '/api/events/filters',
    '/api/events/:param',
    '/api/events/:param/reminder',
    '/api/events/:param/card',
    '/api/me/favourites',
    '/api/me/feed',
    '/api/admin/events',
    '/api/admin/events/:param/status',
  ]);

  it('all routes are accounted for in authorization matrix', () => {
    const missing = normalizedRoutes.filter(r => !knownRoutes.has(r));
    expect(missing).toEqual([]);
  });

  it('all known routes exist in filesystem', () => {
    const missing = [...knownRoutes].filter(r => !normalizedRoutes.includes(r));
    expect(missing).toEqual([]);
  });
});