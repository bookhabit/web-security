'use client';

import { create } from 'zustand';

export type AuthMode = 'v1' | 'v2' | 'v3' | 'v4';

export interface UserInfo {
  id: string;
  email: string;
  points: number;
}

interface AuthStore {
  mode: AuthMode;
  accessToken: string | null; // v4 메모리 저장, v1은 localStorage 직접 사용
  user: UserInfo | null;
  setMode: (mode: AuthMode) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  mode: 'v1',
  accessToken: null,
  user: null,
  setMode: (mode) => set({ mode, accessToken: null, user: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));

// 서비스 레이어(비React)에서 토큰에 접근하기 위한 getter
export const getAccessToken = () => useAuthStore.getState().accessToken;
export const getAuthMode = () => useAuthStore.getState().mode;
