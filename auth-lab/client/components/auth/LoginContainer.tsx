'use client';

import { useAuthStore } from '@/store/authStore';
import { useLoginForm } from '@/hooks/useLoginForm';
import { LoginFormView } from './view/LoginFormView';

export function LoginContainer() {
  const mode = useAuthStore((s) => s.mode);
  const { register, handleSubmit, errors, isPending } = useLoginForm();

  return (
    <LoginFormView
      register={register}
      handleSubmit={handleSubmit}
      errors={errors}
      isPending={isPending}
      mode={mode}
    />
  );
}
