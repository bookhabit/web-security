import { useSuspenseQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export function useMeQuery() {
  const mode = useAuthStore((s) => s.mode);

  return useSuspenseQuery({
    queryKey: ['me', mode],
    queryFn: () => authService.me(mode),
  });
}
