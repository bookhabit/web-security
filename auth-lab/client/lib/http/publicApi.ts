import axios, { AxiosResponse } from "axios";
import { z } from "zod";

/**
 * publicApi
 * - 로그인 / refresh 전용
 * - 토큰 없이 호출
 * - 인증 방식별 baseURL을 동적으로 지정
 */
export const publicApi = axios.create({
  withCredentials: true, // 세션·쿠키 방식에서 필요
  headers: { "Content-Type": "application/json" },
});

const validateResponse = <T>(res: AxiosResponse<T>, schema?: z.ZodSchema): T => {
  if (schema) return schema.parse(res.data) as T;
  return res.data;
};

export const createPublicApi = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  return {
    get: <T>(url: string, schema?: z.ZodSchema) =>
      instance.get<T>(url).then((res) => validateResponse(res, schema)),
    post: <T>(url: string, body?: unknown, schema?: z.ZodSchema) =>
      instance.post<T>(url, body).then((res) => validateResponse(res, schema)),
  };
};
