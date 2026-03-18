'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { GlobalErrorFallback } from './GlobalErrorFallback';

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <GlobalErrorFallback error={error} reset={reset} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
