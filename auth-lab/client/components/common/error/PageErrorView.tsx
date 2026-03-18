"use client";

interface Props {
  error: Error;
  reset: () => void;
}

/**
 * [Page] 페이지 에러 UI (safety net)
 * - component-level boundary가 없는 미완성 페이지를 보호
 * - 재시도 / 뒤로가기 제공
 */
export function PageErrorView({ error, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        페이지를 불러올 수 없습니다
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        {process.env.NODE_ENV === "development" ? error.message : "일시적인 오류입니다."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          뒤로 가기
        </button>
      </div>
    </div>
  );
}
