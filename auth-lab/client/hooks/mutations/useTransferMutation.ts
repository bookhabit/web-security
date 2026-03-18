import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pointService } from '@/services/point.service';
import { useAuthStore } from '@/store/authStore';

export interface TransferInput {
  toEmail: string;
  amount: number;
}

export function useTransferMutation() {
  const mode = useAuthStore((s) => s.mode);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferInput) =>
      pointService.transfer(mode, data.toEmail, data.amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', mode] });
    },
    throwOnError: false,
  });
}
