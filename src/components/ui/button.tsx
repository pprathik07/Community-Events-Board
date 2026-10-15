'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors active:scale-95 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-ink',
  secondary: 'bg-surface text-ink border border-line hover:bg-brand-soft',
  ghost: 'text-muted hover:text-ink hover:bg-brand-soft',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-11 px-6 text-base',
};

/** Shared class string so `<Link>`/`<a>` elements can match a Button exactly. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(BASE, VARIANTS[variant], SIZES[size]);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, fullWidth = false, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(buttonClasses(variant, size), fullWidth && 'w-full', className)}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
});
