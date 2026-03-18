'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { LoginInput } from '@/schemas/auth.schema';
import { AuthMode } from '@/store/authStore';

interface Props {
  register: UseFormRegister<LoginInput>;
  handleSubmit: (e: React.FormEvent) => void;
  errors: FieldErrors<LoginInput> & { root?: { message?: string } };
  isPending: boolean;
  mode: AuthMode;
}

const MODE_INFO: Record<
  AuthMode,
  { title: string; desc: string; color: string }
> = {
  v1: {
    title: 'V1: JWT + localStorage',
    desc: 'AT를 localStorage에 저장합니다. XSS 공격으로 탈취 가능합니다.',
    color: 'border-red-300 bg-red-50',
  },
  v2: {
    title: 'V2: Session Cookie',
    desc: '세션 쿠키로 인증합니다. CSRF 공격에 취약합니다.',
    color: 'border-orange-300 bg-orange-50',
  },
  v3: {
    title: 'V3: HttpOnly Cookie (SameSite=Lax)',
    desc: 'AT를 HttpOnly 쿠키에 저장합니다. GET CSRF 공격에 취약합니다.',
    color: 'border-yellow-300 bg-yellow-50',
  },
  v4: {
    title: 'V4: Hybrid Refresh Token',
    desc: 'AT는 메모리, RT는 HttpOnly+SameSite=Strict 쿠키. 안전합니다.',
    color: 'border-green-300 bg-green-50',
  },
};

export function LoginFormView({ register, handleSubmit, errors, isPending, mode }: Props) {
  const info = MODE_INFO[mode];

  return (
    <div className="mx-auto max-w-md">
      <div className={`mb-4 rounded-lg border p-3 text-sm ${info.color}`}>
        <p className="font-semibold">{info.title}</p>
        <p className="mt-1 text-gray-600">{info.desc}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="victim@test.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            {...register('password')}
            type="password"
            placeholder="victim1234"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {errors.root?.message && (
          <div className="rounded bg-red-50 p-2 text-sm text-red-600">
            {errors.root.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="mt-6 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="font-medium">테스트 계정</p>
        <p>victim@test.com / victim1234 (포인트 100만)</p>
        <p>hacker@test.com / hacker1234</p>
        <p>admin@test.com / admin1234</p>
      </div>
    </div>
  );
}
