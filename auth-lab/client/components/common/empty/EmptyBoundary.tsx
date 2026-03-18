"use client";

import { ReactNode } from "react";

interface Props<T> {
  /** 검사할 데이터 (배열 또는 null/undefined) */
  data: T[] | null | undefined;
  /** 데이터가 비어있을 때 표시할 UI */
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * EmptyBoundary
 * - 로딩 성공 후 데이터가 비어있을 때 fallback 렌더
 * - 에러와 구분되는 정상 상태 (API 성공, 결과 없음)
 *
 * 사용처: Container 내부 (Suspense 안쪽)
 * ```tsx
 * <EmptyBoundary data={items} fallback={<SomeEmptyState />}>
 *   <SomeView items={items} />
 * </EmptyBoundary>
 * ```
 */
export function EmptyBoundary<T>({ data, fallback, children }: Props<T>) {
  if (!data || data.length === 0) return <>{fallback}</>;
  return <>{children}</>;
}
