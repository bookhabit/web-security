'use client';

export const dynamic = 'force-dynamic';

import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/layout/Navbar';
import { AttackPanel } from '@/components/attack/AttackPanel';

export default function AttackPage() {
  const mode = useAuthStore((s) => s.mode);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">공격 도구</h1>
          <p className="mt-1 text-sm text-gray-500">
            현재 모드(<span className="font-semibold">{mode.toUpperCase()}</span>)의 취약점을 직접 공격해보세요.
          </p>
        </div>
        <AttackPanel mode={mode} />
      </main>
    </>
  );
}
