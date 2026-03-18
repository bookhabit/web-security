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
