'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMeQuery } from '@/hooks/queries/useMeQuery';
import { useTransferMutation } from '@/hooks/mutations/useTransferMutation';
import { DashboardView } from './view/DashboardView';

export function DashboardContainer() {
  const { mode, accessToken } = useAuthStore();
  const { data: user } = useMeQuery();
  const { mutate: transfer, isPending: isTransferring } = useTransferMutation();

  const [v1Token, setV1Token] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // V1 localStorage 토큰 읽기
  useEffect(() => {
    if (mode === 'v1') {
      setV1Token(localStorage.getItem('at'));
    }
  }, [mode]);

  const handleTransfer = (toEmail: string, amount: number) => {
    setTransferError(null);
    transfer(
      { toEmail, amount },
      {
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setTransferError(axiosErr?.response?.data?.message ?? '이체에 실패했습니다.');
        },
      },
    );
  };

  return (
    <DashboardView
      user={user}
      mode={mode}
      accessToken={accessToken}
      v1LocalStorageToken={v1Token}
      onTransfer={handleTransfer}
      isTransferring={isTransferring}
      transferError={transferError}
    />
  );
}
