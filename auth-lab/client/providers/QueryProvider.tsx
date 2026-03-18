"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";

/**
 * QueryClient 설정
 *
 * queries.throwOnError: true  → query 에러를 ErrorBoundary로 전파
 * mutations.throwOnError: false → mutation 에러는 호출부에서 직접 처리
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        throwOnError: true,   // → QueryErrorBoundary로 전파
        staleTime: 1000 * 60, // 1분 기본 stale
      },
      mutations: {
        throwOnError: false,  // → 호출부 onError / try-catch 처리
      },
    },
  });
}

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  // useState로 생성 → 서버/클라이언트 렌더 분리 (App Router 권장 패턴)
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
