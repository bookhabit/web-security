import { useSuspenseQuery } from '@tanstack/react-query';
import { postService } from '@/services/post.service';

export function usePostsQuery() {
  return useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: postService.getPosts,
  });
}
