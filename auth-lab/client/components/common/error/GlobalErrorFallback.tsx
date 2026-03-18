"use client";

interface Props {
  error: Error;
  reset: () => void;
}

/**
 * [Global] 전체화면 에러 UI
 * - 최후 보루 — 하위에서 잡지 못한 모든 JS 런타임 에러
 * - 앱 전체 흰 화면(WSOD) 방지
 */
export function GlobalErrorFallback({ error, reset }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">💥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          예상치 못한 오류가 발생했습니다
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          잠시 후 다시 시도해 주세요.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs bg-red-50 text-red-700 p-3 rounded mb-6 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
