'use client';

import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  /** Friendly sentence — never a raw error or status code. */
  message?: string;
  onRetry: () => void;
}

/** Error state with a guaranteed Retry action. */
export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-1.5">Something went wrong</h3>
      <p className="text-muted text-sm mb-6 max-w-sm mx-auto">{message}</p>
      <Button variant="primary" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Try again
      </Button>
    </div>
  );
}
