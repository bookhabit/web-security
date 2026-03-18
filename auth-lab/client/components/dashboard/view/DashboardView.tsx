'use client';

import { UserProfile } from '@/schemas/user.schema';
import { AuthMode } from '@/store/authStore';

interface Props {
  user: UserProfile;
  mode: AuthMode;
  accessToken: string | null;
  v1LocalStorageToken: string | null;
  onTransfer: (toEmail: string, amount: number) => void;
  isTransferring: boolean;
  transferError: string | null;
}

const TOKEN_STORAGE_INFO: Record<AuthMode, { label: string; desc: string; safe: boolean }> = {
  v1: {
    label: 'localStorage["v1_at"]',
    desc: 'DevTools → Application → localStorage에서 직접 확인 가능 (XSS 취약)',
    safe: false,
  },
  v2: {
    label: '세션 쿠키 (HttpOnly)',
    desc: 'JS 접근 불가. 하지만 CSRF 공격으로 세션 쿠키 자동 전송 가능',
    safe: false,
  },
  v3: {
    label: 'HttpOnly 쿠키 (SameSite=Lax)',
    desc: 'JS 접근 불가. 하지만 GET 요청에 쿠키 전송 → img 태그 공격 가능',
    safe: false,
  },
  v4: {
    label: 'Zustand 메모리 (AT) + HttpOnly 쿠키 (RT)',
    desc: 'AT는 페이지 이탈 시 소멸. RT는 SameSite=Strict → CSRF 불가',
    safe: true,
  },
};

export function DashboardView({
  user,
  mode,
  accessToken,
  v1LocalStorageToken,
  onTransfer,
  isTransferring,
  transferError,
}: Props) {
  const storageInfo = TOKEN_STORAGE_INFO[mode];

  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const toEmail = fd.get('toEmail') as string;
    const amount = Number(fd.get('amount'));
    onTransfer(toEmail, amount);
  };

  return (
    <div className="space-y-6">
      {/* 사용자 정보 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">내 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">이메일</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">포인트</p>
            <p className="text-xl font-bold text-blue-600">
              {user.points.toLocaleString()}P
            </p>
          </div>
        </div>
      </div>

      {/* 토큰 저장소 시각화 */}
      <div
        className={`rounded-lg border p-4 ${
          storageInfo.safe
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          토큰 저장 위치: {storageInfo.label}
        </h3>
        <p className="mb-3 text-xs text-gray-500">{storageInfo.desc}</p>

        {mode === 'v1' && (
          <div className="rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
            <p className="text-gray-400">// localStorage["v1_at"]</p>
            <p className="break-all">{v1LocalStorageToken ?? '(토큰 없음)'}</p>
          </div>
        )}
        {mode === 'v4' && accessToken && (
          <div className="rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
            <p className="text-gray-400">// Zustand 메모리 (AT, 15분)</p>
            <p className="break-all">{accessToken.slice(0, 60)}...</p>
          </div>
        )}
        {(mode === 'v2' || mode === 'v3') && (
          <div className="rounded bg-gray-900 p-3 font-mono text-xs text-yellow-400">
            <p>// HttpOnly 쿠키 — JS로 접근 불가 (document.cookie에 미노출)</p>
            <p>// 하지만 브라우저가 모든 요청에 자동으로 전송합니다</p>
          </div>
        )}
      </div>

      {/* 포인트 이체 (V1/V4만 지원) */}
      {(mode === 'v1' || mode === 'v4') && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">포인트 이체</h3>
          <form onSubmit={handleTransferSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">받는 사람 이메일</label>
              <input
                name="toEmail"
                type="email"
                placeholder="hacker@test.com"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">금액</label>
              <input
                name="amount"
                type="number"
                placeholder="1000"
                min={1}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            {transferError && (
              <p className="text-xs text-red-600">{transferError}</p>
            )}
            <button
              type="submit"
              disabled={isTransferring}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isTransferring ? '처리 중...' : '이체하기'}
            </button>
          </form>
        </div>
      )}

      {(mode === 'v2' || mode === 'v3') && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm">
          <p className="font-medium text-orange-800">포인트 이체는 V1/V4 모드에서만 지원합니다.</p>
          <p className="mt-1 text-orange-600">
            {mode === 'v2'
              ? 'V2 CSRF 공격을 시연하려면 공격 페이지를 사용하세요.'
              : 'V3 GET CSRF 공격을 시연하려면 공격 페이지를 사용하세요.'}
          </p>
        </div>
      )}
    </div>
  );
}
