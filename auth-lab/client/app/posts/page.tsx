export const dynamic = 'force-dynamic';

import { Navbar } from '@/components/layout/Navbar';
import { PostListContainer } from '@/components/posts/PostListContainer';
import { PageAsyncBoundary } from '@/layouts/PageAsyncBoundary';

export default function PostsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">게시글</h1>
          <p className="mt-1 text-sm text-gray-500">
            V1 모드: XSS 페이로드가 실행됩니다 (dangerouslySetInnerHTML).
            V2~V4: 일반 텍스트로 렌더링됩니다.
          </p>
        </div>
        <PageAsyncBoundary>
          <PostListContainer />
        </PageAsyncBoundary>
      </main>
    </>
  );
}
