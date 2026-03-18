import { baseClient, v1PrivateClient, v4PrivateClient } from '@/lib/http/apiClients';
import { loginResponseSchema, LoginInput, LoginResponse } from '@/schemas/auth.schema';
import { userSchema, UserProfile } from '@/schemas/user.schema';
import type { AuthMode } from '@/store/authStore';

export const authService = {
  login: async (mode: AuthMode, data: LoginInput): Promise<LoginResponse> => {
    const raw = await baseClient.post(`/auth/${mode}/login`, data);
    return loginResponseSchema.parse(raw);
  },

  logout: async (mode: AuthMode): Promise<void> => {
    if (mode === 'v2' || mode === 'v3' || mode === 'v4') {
      await baseClient.post(`/auth/${mode}/logout`);
    }
  },

  me: async (mode: AuthMode): Promise<UserProfile> => {
    let raw: unknown;
    if (mode === 'v1') {
      raw = await v1PrivateClient.get('/auth/v1/me');
    } else if (mode === 'v4') {
      raw = await v4PrivateClient.get('/auth/v4/me');
    } else {
      // v2: 세션 쿠키, v3: AT 쿠키 — 자동 전송
      raw = await baseClient.get(`/auth/${mode}/me`);
    }
    return userSchema.parse(raw);
  },
};
