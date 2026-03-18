# HTTP + Zod + Query 아키텍처 간결 정리

## 🎯 목적

- Axios 인스턴스 통합 관리
- 토큰 자동 갱신
- Zod 런타임 검증
- Service / Query 레이어 분리 유지

---

# 1️⃣ HTTP Layer (axios 통합 인스턴스)

## 역할

- 토큰 자동 주입
- 401 발생 시 refresh 처리
- 응답 Zod 검증 통합
- public / private API 분리

---

## 구조 핵심

### ✅ publicApi

- 로그인 / refresh 전용
- 토큰 없이 호출

---

### ✅ privateApi

- 요청 시 Authorization 자동 주입

401 발생 시:

1. refresh API 호출
2. accessToken 재발급
3. 기존 요청 재시도
4. 실패 시 로그아웃 처리

---

### ✅ 응답 검증 통합

```ts
const validateResponse = <T>(
  res: AxiosResponse<T>,
  schema?: z.ZodSchema
): T => {
  if (schema) return schema.parse(res.data);
  return res.data;
};
```
