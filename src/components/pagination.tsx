'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export const Pagination = memo(function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || newPage === page) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [page, totalPages, pathname, router, searchParams]
  );

  if (totalPages <= 1) return null;

  const navBtn = cn(
    'inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg border border-line bg-surface text-sm font-medium text-ink',
    'transition-colors hover:border-brand/40 hover:bg-brand-soft',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface'
  );

  return (
    <nav className="flex items-center justify-center gap-3 pt-2" aria-label="Pagination">
      <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className={navBtn}>
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <span className="text-sm font-medium text-muted px-1" aria-live="polite">
        Page {page} of {totalPages}
      </span>

      <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className={navBtn}>
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
});
