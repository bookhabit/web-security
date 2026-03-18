"use client";

import { Suspense, ReactNode } from "react";
import { QueryErrorBoundary } from "@/components/common/error/QueryErrorBoundary";
import { PageErrorView } from "@/components/common/error/PageErrorView";
import { PageLoadingView } from "@/components/common/loading/PageLoadingView";

interface Props {
  children: ReactNode;
}

/**
 * PageAsyncBoundary
 * - [Page] safety net — component-level boundary가 없는 페이지 보호
 * - App Router 레이아웃 또는 각 페이지에서 감싸서 사용
 *
 * Suspense 발동 시점:
 *   현재: React.lazy() 미사용 → 발동 안 함 (dormant)
 *   향후: lazy() 도입 시 PageLoadingView 표시
 *
 * QueryErrorBoundary 발동 시점:
 *   - component-level boundary 없는 페이지의 query 에러를 catch
 *   - component-level boundary 있는 페이지는 해당 boundary가 먼저 catch
 */
export function PageAsyncBoundary({ children }: Props) {
  return (
    <QueryErrorBoundary fallback={PageErrorView}>
      <Suspense fallback={<PageLoadingView />}>{children}</Suspense>
    </QueryErrorBoundary>
  );
}
