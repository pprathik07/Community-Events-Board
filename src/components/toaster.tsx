'use client';

import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * One toast component for all feedback.
 * Bottom-centre on phone, bottom-right on laptop, auto-dismiss after 4s.
 */
export function Toaster() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <SonnerToaster
      position={isDesktop ? 'bottom-right' : 'bottom-center'}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-line bg-surface px-4 py-3 shadow-card text-ink',
          error: 'border-danger/30 bg-danger/5',
          success: 'border-success/30 bg-success/5',
        },
      }}
    />
  );
}
