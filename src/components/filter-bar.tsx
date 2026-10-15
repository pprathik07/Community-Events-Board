'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORIES, categoryStyle, type Category } from '@/lib/constants';
import { Search, X, MapPin, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  categories: string[];
  cities: string[];
}

/** Compare two query strings ignoring key order, treating a missing `page` as 1. */
function sameQuery(a: URLSearchParams, b: URLSearchParams): boolean {
  const normalize = (params: URLSearchParams) => {
    const entries = new Map(params.entries());
    if (!entries.has('page')) entries.set('page', '1');
    return Array.from(entries.entries())
      .filter(([, value]) => value !== '')
      .sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  };
  return normalize(a) === normalize(b);
}

export function FilterBar({ cities }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(
    (searchParams.get('category') as Category) || 'all'
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const isFirstRun = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (debouncedSearch) params.set('q', debouncedSearch);
    // Always reset to page 1 whenever a filter changes.
    params.set('page', '1');

    // Skip no-op navigation so the URL stays stable across re-renders.
    if (sameQuery(params, searchParams)) return;

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCategory, selectedCity, debouncedSearch, pathname, router, searchParams]);

  useEffect(() => {
    // Skip the first run: the URL already reflects the current filters.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    updateFilters();
  }, [updateFilters]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          aria-label="Search events"
          className="w-full h-11 pl-11 pr-10 rounded-lg border border-line bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category chips + city scroll sideways on phone, sit in one row from sm up. */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          aria-pressed={selectedCategory === 'all'}
          className={cn(
            'h-11 px-4 rounded-full text-sm font-medium shrink-0 whitespace-nowrap transition-colors active:scale-95',
            selectedCategory === 'all'
              ? 'bg-brand text-white'
              : 'bg-surface border border-line text-ink hover:bg-brand-soft'
          )}
        >
          All
        </button>

        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(active ? 'all' : cat)}
              aria-pressed={active}
              style={active ? categoryStyle(cat) : undefined}
              className={cn(
                'h-11 px-4 rounded-full text-sm font-medium shrink-0 whitespace-nowrap border transition-colors active:scale-95',
                active
                  ? 'border-transparent ring-2 ring-brand/30'
                  : 'bg-surface border-line text-ink hover:bg-brand-soft'
              )}
            >
              {cat}
            </button>
          );
        })}

        <span className="w-px h-7 bg-line shrink-0 mx-1" aria-hidden />

        <div className="relative shrink-0">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Filter by city"
            className="h-11 pl-10 pr-9 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand appearance-none"
          >
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
