import { baseClient } from '@/lib/http/apiClients';
import { postListSchema, Post } from '@/schemas/post.schema';

export const postService = {
  getPosts: async (): Promise<Post[]> => {
    const raw = await baseClient.get('/api/posts');
    return postListSchema.parse(raw);
  },
};
