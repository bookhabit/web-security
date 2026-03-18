import { v1PrivateClient, v4PrivateClient } from '@/lib/http/apiClients';
import type { AuthMode } from '@/store/authStore';

export interface TransferResult {
  message: string;
  fromPoints?: number;
  toPoints?: number;
}

export const pointService = {
  transfer: async (
    mode: AuthMode,
    toEmail: string,
    amount: number,
  ): Promise<TransferResult> => {
    // V1/V4만 포인트 이체 지원 (Bearer 토큰 필요)
    const client = mode === 'v4' ? v4PrivateClient : v1PrivateClient;
    return client.post<TransferResult>('/api/points/transfer', { toEmail, amount });
  },
};
