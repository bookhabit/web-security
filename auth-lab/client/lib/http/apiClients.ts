import { createPublicApi } from './publicApi';
import { createPrivateApi } from './privateApi';
import { getAccessToken, useAuthStore } from '@/store/authStore';

const BASE_URL = 'http://localhost:4001';

// 공통 public 클라이언트 (로그인, 세션/쿠키 요청)
export const baseClient = createPublicApi(BASE_URL);

// V1: AT를 localStorage에서 읽음 (❌ XSS 취약)
export const v1PrivateClient = createPrivateApi(
  BASE_URL,
  () => (typeof window !== 'undefined' ? localStorage.getItem('at') : null),
  async () => {
    throw new Error('V1은 refresh를 지원하지 않습니다. 다시 로그인해주세요.');
  },
  () => {
    if (typeof window !== 'undefined') localStorage.removeItem('at');
    useAuthStore.getState().logout();
  },
);

// V4: AT를 Zustand 메모리에서 읽음 (✅ XSS 불가)
export const v4PrivateClient = createPrivateApi(
  BASE_URL,
  getAccessToken,
  async () => {
    // RT 쿠키로 AT 재발급 (쿠키 자동 전송)
    const data = await baseClient.post<{ accessToken: string }>('/auth/v4/refresh');
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  },
  () => useAuthStore.getState().logout(),
);
