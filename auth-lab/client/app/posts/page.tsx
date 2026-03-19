export const dynamic = 'force-dynamic';

import { Navbar } from '@/components/layout/Navbar';
import { PostListContainer } from '@/components/posts/PostListContainer';
import { PostFormContainer } from '@/components/posts/PostFormContainer';
import { PageAsyncBoundary } from '@/layouts/PageAsyncBoundary';

export default function PostsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">게시글</h1>
          <p className="mt-1 text-sm text-gray-500">
            V1 모드: HTML이 그대로 렌더링됩니다 — XSS 페이로드 직접 작성 후 공격해보세요.
          </p>
        </div>

        {/* 게시글 작성 폼 */}
        <div className="mb-8">
          <PostFormContainer />
        </div>

        {/* 게시글 목록 */}
        <PageAsyncBoundary>
          <PostListContainer />
        </PageAsyncBoundary>
      </main>
    </>
  );
}
