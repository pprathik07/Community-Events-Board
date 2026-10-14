import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-md skeleton', className)} />;
}

/** Six card placeholders that match the size of a real event card. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl overflow-hidden border border-line shadow-soft">
          <div className="aspect-[16/9] skeleton" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 rounded-full skeleton" />
            <div className="h-5 w-4/5 rounded-md skeleton" />
            <div className="h-4 w-1/2 rounded-md skeleton" />
            <div className="flex items-center justify-between pt-3 border-t border-line">
              <div className="h-5 w-16 rounded-md skeleton" />
              <div className="h-9 w-28 rounded-lg skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rows matching the admin list layout (table on laptop, cards on phone). */
export function AdminListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-line shadow-soft p-4 flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-56 rounded-md skeleton" />
            <div className="h-3 w-40 rounded-md skeleton" />
          </div>
          <div className="h-6 w-20 rounded-full skeleton" />
          <div className="h-7 w-12 rounded-full skeleton" />
        </div>
      ))}
    </div>
  );
}

/**
 * Backwards-compatible wrapper: pages call this with a `variant` and get the
 * right skeleton for a card grid or the admin list.
 */
export function LoadingSkeleton({ count = 6, variant = 'card' }: { count?: number; variant?: 'card' | 'table' }) {
  return variant === 'table' ? <AdminListSkeleton count={count} /> : <CardGridSkeleton count={count} />;
}
