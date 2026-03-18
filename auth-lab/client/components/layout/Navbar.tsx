'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, AuthMode } from '@/store/authStore';
import { authService } from '@/services/auth.service';

const MODES: { value: AuthMode; label: string; color: string }[] = [
  { value: 'v1', label: 'V1 JWT+localStorage', color: 'bg-red-500' },
  { value: 'v2', label: 'V2 Session', color: 'bg-orange-500' },
  { value: 'v3', label: 'V3 HttpOnly+Lax', color: 'bg-yellow-500' },
  { value: 'v4', label: 'V4 Hybrid', color: 'bg-green-500' },
];

const VULN_LABELS: Record<AuthMode, string> = {
  v1: '❌ XSS 취약 — AT가 localStorage에 노출됨',
  v2: '❌ CSRF 취약 — 세션 쿠키가 외부 폼에서 자동 전송됨',
  v3: '❌ GET CSRF 취약 — SameSite=Lax로 img 태그 공격 가능',
  v4: '✅ 안전 — AT 메모리 저장, RT SameSite=Strict',
};

export function Navbar() {
  const { mode, setMode, user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    // 모드 변경 시 캐시 초기화는 query invalidation으로 처리됨
  };

  const handleLogout = async () => {
    try {
      await authService.logout(mode);
    } catch {}
    if (mode === 'v1') localStorage.removeItem('at');
    logout();
    router.push('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      {/* 취약점 배너 */}
      <div
        className={`px-4 py-1 text-center text-xs font-medium text-white ${
          mode === 'v4' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {VULN_LABELS[mode]}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* 모드 탭 */}
        <div className="flex gap-1 border-b border-gray-100 py-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                mode === m.value
                  ? `${m.color} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between py-3">
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium ${
                pathname === '/dashboard'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              대시보드
            </Link>
            <Link
              href="/posts"
              className={`text-sm font-medium ${
                pathname === '/posts'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              게시글
            </Link>
            <Link
              href="/attack"
              className={`text-sm font-medium ${
                pathname === '/attack'
                  ? 'text-red-600'
                  : 'text-red-400 hover:text-red-600'
              }`}
            >
              공격 도구
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                {user.email}{' '}
                <span className="font-semibold text-blue-600">
                  {user.points.toLocaleString()}P
                </span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
