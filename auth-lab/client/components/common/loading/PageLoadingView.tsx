/**
 * [Page] 전체화면 로딩 스피너
 * - React.lazy() 코드 스플리팅 도입 시 활성화
 * - 현재는 PageAsyncBoundary의 Suspense fallback으로 대기
 */
export function PageLoadingView() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">불러오는 중...</p>
      </div>
    </div>
  );
}
