'use client';

import { Post } from '@/schemas/post.schema';
import { AuthMode } from '@/store/authStore';

interface Props {
  posts: Post[];
  mode: AuthMode;
}

export function PostListView({ posts, mode }: Props) {
  const isXssVulnerable = mode === 'v1';

  return (
    <div className="space-y-4">
      {isXssVulnerable && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">⚠️ XSS 취약 모드 (V1)</p>
          <p className="mt-1 text-xs">
            게시글 내용이 HTML로 렌더링됩니다. 악성 스크립트가 실행될 수 있습니다.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{post.title}</h3>
            <span className="text-xs text-gray-400">
              작성자 {post.authorId?.slice(0, 8) ?? '익명'}
            </span>
          </div>

          {isXssVulnerable ? (
            // ❌ V1: dangerouslySetInnerHTML — XSS 취약점 시연
            <div
              className="prose prose-sm text-gray-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            // ✅ V2~V4: 일반 텍스트 렌더링
            <p className="whitespace-pre-wrap text-sm text-gray-600">
              {post.content}
            </p>
          )}

          {post.createdAt && (
            <p className="mt-2 text-xs text-gray-400">
              {new Date(post.createdAt).toLocaleString('ko-KR')}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
