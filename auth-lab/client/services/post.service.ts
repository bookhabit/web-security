import { baseClient, v1PrivateClient, v4PrivateClient } from '@/lib/http/apiClients';
import { postListSchema, Post, CreatePostInput } from '@/schemas/post.schema';
import type { AuthMode } from '@/store/authStore';

export const postService = {
  getPosts: async (): Promise<Post[]> => {
    const raw = await baseClient.get('/api/posts');
    return postListSchema.parse(raw);
  },

  createPost: async (mode: AuthMode, data: CreatePostInput): Promise<Post> => {
    let raw: unknown;
    if (mode === 'v1') {
      raw = await v1PrivateClient.post('/api/posts', data);
    } else if (mode === 'v4') {
      raw = await v4PrivateClient.post('/api/posts', data);
    } else {
      // v2(세션 쿠키), v3(AT 쿠키) — withCredentials로 자동 전송
      raw = await baseClient.post('/api/posts', data);
    }
    // 서버가 생성된 post 객체를 반환 (id, title, content, authorId, createdAt)
    return raw as Post;
  },
};
