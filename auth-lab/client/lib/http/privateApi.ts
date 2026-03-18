import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";

/**
 * privateApi
 * - 인증이 필요한 API 전용
 * - 요청 시 Authorization 헤더 자동 주입 (V1/V4: Bearer 토큰)
 * - 401 발생 시: refresh → 재시도 → 실패 시 로그아웃
 */

type TokenGetter = () => string | null;
type RefreshFn = () => Promise<string>;
type LogoutFn = () => void;

export const createPrivateApi = (
  baseURL: string,
  getAccessToken: TokenGetter,
  refresh: RefreshFn,
  logout: LogoutFn
): PrivateApiClient => {
  const instance: AxiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  // ── 요청 인터셉터: AT 자동 주입 ──────────────────────────────
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ── 응답 인터셉터: 401 → refresh → 재시도 ───────────────────
  let isRefreshing = false;
  let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  const flushQueue = (token: string) =>
    pendingQueue.forEach((p) => p.resolve(token));
  const rejectQueue = (err: unknown) =>
    pendingQueue.forEach((p) => p.reject(err));

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refresh();
        flushQueue(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        rejectQueue(refreshError);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        pendingQueue = [];
      }
    }
  );

  const validateResponse = <T>(res: AxiosResponse<T>, schema?: z.ZodSchema): T => {
    if (schema) return schema.parse(res.data) as T;
    return res.data;
  };

  return {
    get: <T>(url: string, schema?: z.ZodSchema) =>
      instance.get<T>(url).then((res) => validateResponse(res, schema)),
    post: <T>(url: string, body?: unknown, schema?: z.ZodSchema) =>
      instance.post<T>(url, body).then((res) => validateResponse(res, schema)),
    patch: <T>(url: string, body?: unknown, schema?: z.ZodSchema) =>
      instance.patch<T>(url, body).then((res) => validateResponse(res, schema)),
    delete: <T>(url: string, schema?: z.ZodSchema) =>
      instance.delete<T>(url).then((res) => validateResponse(res, schema)),
  };
};

export interface PrivateApiClient {
  get: <T>(url: string, schema?: z.ZodSchema) => Promise<T>;
  post: <T>(url: string, body?: unknown, schema?: z.ZodSchema) => Promise<T>;
  patch: <T>(url: string, body?: unknown, schema?: z.ZodSchema) => Promise<T>;
  delete: <T>(url: string, schema?: z.ZodSchema) => Promise<T>;
}
