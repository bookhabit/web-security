import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/post.service';
import { useAuthStore } from '@/store/authStore';
import type { CreatePostInput } from '@/schemas/post.schema';

export function useCreatePostMutation() {
  const mode = useAuthStore((s) => s.mode);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => postService.createPost(mode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    throwOnError: false,
  });
}
