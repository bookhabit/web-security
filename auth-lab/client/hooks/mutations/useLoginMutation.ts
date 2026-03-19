import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { LoginInput } from "@/schemas/auth.schema";

export function useLoginMutation() {
  const { mode, setAccessToken, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(mode, data),
    onSuccess: (res) => {
      // V1: ❌ localStorage에 저장 (XSS 취약점 시연)
      if (mode === "v1" && res.accessToken) {
        localStorage.setItem("at", res.accessToken); // 'at' — XSS 페이로드와 동일한 키
      }
      // V4: ✅ Zustand 메모리에 저장 (XSS 불가)
      if (mode === "v4" && res.accessToken) {
        setAccessToken(res.accessToken);
      }
      if (res.user) {
        // V2는 points 미반환 → 0으로 채움 (대시보드에서 me API로 갱신됨)
        setUser({
          id: res.user.id,
          email: res.user.email,
          points: res.user.points ?? 0,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    throwOnError: false,
  });
}
