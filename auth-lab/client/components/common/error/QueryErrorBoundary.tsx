"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

interface Props {
  /** ErrorState 컴포넌트 (error, reset props 수신) */
  fallback: ComponentType<ErrorFallbackProps>;
  children: ReactNode;
}

/**
 * QueryErrorBoundary
 * - QueryErrorResetBoundary + ErrorBoundary 합성
 * - query.reset() + boundary.reset() 동시 호출 (재요청 보장)
 * - 사용처: 각 Page 내부의 데이터 영역
 */
export function QueryErrorBoundary({ fallback: Fallback, children }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: queryReset }) => (
        <ErrorBoundary
          fallback={(error, boundaryReset) => {
            const handleReset = () => {
              queryReset();       // TanStack Query 에러 초기화
              boundaryReset();    // ErrorBoundary 상태 초기화
            };
            return <Fallback error={error} reset={handleReset} />;
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
