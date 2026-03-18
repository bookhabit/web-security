export const dynamic = 'force-dynamic';

import { Navbar } from '@/components/layout/Navbar';
import { DashboardContainer } from '@/components/dashboard/DashboardContainer';
import { PageAsyncBoundary } from '@/layouts/PageAsyncBoundary';

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            현재 인증 방식과 토큰 저장 위치를 확인하세요.
          </p>
        </div>
        <PageAsyncBoundary>
          <DashboardContainer />
        </PageAsyncBoundary>
      </main>
    </>
  );
}
