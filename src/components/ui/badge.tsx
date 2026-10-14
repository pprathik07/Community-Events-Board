import { categoryStyle } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ className, children, style }: BadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        className
      )}
    >
      {children}
    </span>
  );
}

/** Soft category badge driven by the single CATEGORY_STYLES source. */
export function CategoryBadge({
  category,
  className,
  children,
}: {
  category: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge className={cn('bg-brand-soft text-brand-ink', className)} style={categoryStyle(category)}>
      {children ?? category}
    </Badge>
  );
}

/** Active / Inactive status pill used in the admin list. */
export function StatusBadge({ isActive, className }: { isActive: boolean; className?: string }) {
  return (
    <Badge
      className={cn(
        isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
        className
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

/** "Free" pill shown when an event costs ₹0. */
export function FreeBadge({ className }: { className?: string }) {
  return <Badge className={cn('bg-success text-white', className)}>Free</Badge>;
}
