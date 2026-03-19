import { z } from 'zod';

export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string().optional(),
  authorId: z.string().optional(),
});

export const postListSchema = z.array(postSchema);

export type Post = z.infer<typeof postSchema>;

// 게시글 작성 폼 스키마
export const createPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
