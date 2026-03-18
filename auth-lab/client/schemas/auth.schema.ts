import { z } from 'zod';

// 로그인 폼 입력 스키마
export const loginSchema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 서버 응답 스키마 (v1~v4 공용)
export const loginResponseSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      points: z.number(),
    })
    .optional(),
  message: z.string().optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
