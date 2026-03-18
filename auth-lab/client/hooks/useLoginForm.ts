'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/schemas/auth.schema';
import { useLoginMutation } from '@/hooks/mutations/useLoginMutation';

export function useLoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const { mutate, isPending } = useLoginMutation();

  const onSubmit = (data: LoginInput) => {
    mutate(data, {
      onSuccess: () => {
        router.push('/dashboard');
      },
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const message = axiosErr?.response?.data?.message ?? '로그인에 실패했습니다.';
        setError('root', { message });
      },
    });
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isPending,
  };
}
