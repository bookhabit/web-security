'use client';

import { useAuthStore } from '@/store/authStore';
import { usePostsQuery } from '@/hooks/queries/usePostsQuery';
import { PostListView } from './view/PostListView';

export function PostListContainer() {
  const mode = useAuthStore((s) => s.mode);
  const { data: posts } = usePostsQuery();

  return <PostListView posts={posts} mode={mode} />;
}
