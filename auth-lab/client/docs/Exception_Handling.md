# 전역 에러 핸들링 및 로딩 시스템 가이드

## 1. 전체 구조

```
QueryClientProvider
  └─ ErrorBoundary → GlobalErrorFallback           ← [Global] JS 크래시 전체 보호
       └─ BrowserRouter
            └─ PageAsyncBoundary (layout route)      ← [Page]  안전망 (safety net)
                 ├─ QueryErrorBoundary → PageErrorView
                 └─ Suspense → PageLoadingView
                      └─ Page (e.g. JobsPage)
                           └─ QueryErrorBoundary → JobListErrorView   ← [Component] 실제 처리
                                └─ Suspense → JobListLoadingView
                                     └─ JobListContainer
                                          └─ EmptyBoundary → JobListEmptyView
                                               └─ JobListView
```

---

## 2. 레벨별 역할과 필요성

### 2-1. Global — `ErrorBoundary` (main.tsx)

| 항목      | 내용                                               |
| --------- | -------------------------------------------------- |
| 위치      | `main.tsx`                                         |
| Fallback  | `GlobalErrorFallback` (전체화면, 새로고침/홈 버튼) |
| 발동 조건 | 하위 레벨에서 잡지 못한 모든 JS 런타임 에러        |
| 역할      | 최후 보루 — 앱 전체 흰 화면(WSOD) 방지             |

```
ErrorBoundary는 필수. 어떤 컴포넌트든 예외가 날 수 있고
React는 에러가 boundary 없이 bubbling되면 앱 전체를 unmount한다.
```

---

### 2-2. Page — `PageAsyncBoundary` (App.tsx layout route)

| 항목             | 내용                                           |
| ---------------- | ---------------------------------------------- |
| 위치             | App.tsx 라우트 트리 (layout route)             |
| Fallback Error   | `PageErrorView` (페이지 영역, 재시도/뒤로가기) |
| Fallback Loading | `PageLoadingView`                              |
| 발동 조건        | 아래 2가지 상황에서만 실제로 발동              |

**Page Suspense 발동 시점**

```
현재: ❌ 발동 안 함
이유: 모든 페이지가 정적 import (React.lazy 미사용)

향후 React.lazy() 도입 시:
  const JobsPage = lazy(() => import('./pages/jobs/JobsPage'))
  → 라우트 진입 시 PageLoadingView 표시 ✅
```

**Page QueryErrorBoundary 발동 시점**

```
JobsPage → JobListContainer에 컴포넌트 레벨 boundary 있음
           → 에러는 컴포넌트 레벨에서 먼저 catch
           → PageAsyncBoundary boundary는 발동 안 함 ✅

아직 component-level boundary가 없는 페이지 (ChatPage 등)
  → query 에러 발생 시 PageAsyncBoundary가 잡아줌 ✅ (safety net)
```

**결론: Page 레벨은 필요하다**

- component-level boundary가 없는 미완성 페이지에 대한 **안전망**
- `React.lazy()` 코드 스플리팅 도입 시 **즉시 활성화**
- 없으면 boundary 미적용 페이지는 Global까지 에러가 올라가 전체 앱이 죽음

---

### 2-3. Component — `QueryErrorBoundary + Suspense` (각 페이지 내부)

| 항목             | 내용                                                       |
| ---------------- | ---------------------------------------------------------- |
| 위치             | 각 Page 컴포넌트 내부 (헤더/탭바 바깥, 데이터 컴포넌트 안) |
| Fallback Error   | 기능별 ErrorState (e.g. `JobListErrorView`)                |
| Fallback Loading | 기능별 LoadingState (e.g. `JobListLoadingView`)            |
| 발동 조건        | `useSuspenseQuery` / `useSuspenseInfiniteQuery` 로딩·에러  |
| 핵심 가치        | **헤더/탭바가 살아있음** — 데이터 영역만 교체              |

```tsx
// JobsPage.tsx — 헤더는 boundary 밖, 목록만 boundary 안
<div>
  <Header />          {/* 에러/로딩과 무관하게 항상 렌더 */}
  <QueryErrorBoundary fallback={JobListErrorView}>
    <Suspense fallback={<JobListLoadingView />}>
      <JobListContainer />   {/* 이 영역만 교체됨 */}
    </Suspense>
  </QueryErrorBoundary>
</div>
```

---

### 2-4. Empty — `EmptyBoundary` (데이터 컴포넌트 내부)

| 항목                   | 내용                                              |
| ---------------------- | ------------------------------------------------- |
| 위치                   | Container 컴포넌트 내부 (Suspense 안쪽)           |
| Fallback               | 기능별 EmptyState (e.g. `JobListEmptyView`)       |
| 발동 조건              | 로딩 성공 후 data 배열이 비어있을 때              |
| Error/Loading과의 차이 | 에러가 아닌 **정상 상태** — API 성공 후 결과 없음 |

**4-state 흐름 (컴포넌트 단위)**

```
useSuspenseQuery 호출
  │
  ├─ suspended   → Suspense fallback (LoadingState)
  ├─ throws      → QueryErrorBoundary fallback (ErrorState)
  └─ resolved
       ├─ data.length === 0  → EmptyBoundary fallback (EmptyState)
       └─ data.length > 0   → children (실제 UI)
```

---

## 3. 파일 구조 (현재 상태)

```
src/
├── components/
│   └── common/
│       ├── error/
│       │   ├── ErrorBoundary.tsx          # React 클래스 컴포넌트 — 범용 boundary
│       │   ├── QueryErrorBoundary.tsx     # QueryErrorResetBoundary + ErrorBoundary 합성
│       │   ├── GlobalErrorFallback.tsx    # [Global] 전체화면 에러 UI
│       │   ├── PageErrorView.tsx      # [Page] 페이지 에러 UI + 재시도/뒤로가기
│       │   └── index.ts
│       ├── loading/
│       │   ├── PageLoadingView.tsx        # [Page] 전체화면 스피너
│       │   └── index.ts
│       └── empty/
│           └── EmptyBoundary.tsx          # 데이터 비어있을 때 fallback 렌더
│
├── components/
│   └── jobs/
│       └── exception/
│           ├── JobListLoadingView.tsx    # [Component] jobs 목록 로딩 스켈레톤
│           ├── JobListErrorView.tsx      # [Component] jobs 목록 에러 UI
│           └── JobListEmptyView.tsx      # [Empty] jobs 목록 비어있을 때 UI
│
└── layouts/
    └── PageAsyncBoundary.tsx               # [Page] QueryErrorBoundary + Suspense 레이아웃 라우트
```

---

## 4. QueryClient 설정

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: true,      // query 에러 → ErrorBoundary로 전파
    },
    mutations: {
      throwOnError: false,     // mutation 에러 → 호출부에서 직접 처리 (토스트 등)
    },
  },
});
```

---

## 5. 새 페이지/기능 추가 시 체크리스트

### 5-1. 데이터를 가져오는 Container 컴포넌트 작성

```tsx
// ✅ useSuspenseQuery 사용 (isPending/isError 분기 없음)
export function SomeContainer() {
  const { data } = useSuspenseQuery(someQueryOptions);
  const items = data.items;

  return (
    <EmptyBoundary data={items} fallback={<SomeEmptyState />}>
      <SomeView items={items} />
    </EmptyBoundary>
  );
}
```

### 5-2. 페이지에서 감싸기

```tsx
// ✅ 헤더 바깥, 데이터 영역 안
export function SomePage() {
  return (
    <div>
      <PageHeader />  {/* boundary 밖 → 항상 렌더 */}

      <QueryErrorBoundary fallback={SomeErrorState}>
        <Suspense fallback={<SomeLoadingState />}>
          <SomeContainer />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  );
}
```

### 5-3. exception 폴더 구성 (기능별)

```
src/components/{feature}/exception/
  ├── {Feature}LoadingState.tsx   # Skeleton UI
  ├── {Feature}ErrorState.tsx     # 에러 UI + reset 버튼
  └── {Feature}EmptyState.tsx     # 빈 상태 UI
```

---

## 6. 에러 타입별 처리 위치 요약

| 에러 종류                                      | 처리 위치                              | 방법                           |
| ---------------------------------------------- | -------------------------------------- | ------------------------------ |
| JS 런타임 에러 (예상 불가)                     | Global `ErrorBoundary`                 | 전체화면 fallback              |
| Query 에러 (API 실패) — 컴포넌트 boundary 있음 | Component `QueryErrorBoundary`         | 인라인 fallback + 재시도       |
| Query 에러 (API 실패) — 컴포넌트 boundary 없음 | Page `QueryErrorBoundary` (safety net) | 페이지 fallback + 재시도       |
| Mutation 에러 (폼 제출, CRUD)                  | 호출부 try/catch                       | 토스트 메시지 / 폼 에러        |
| 401 인증 에러                                  | axios interceptor                      | 토큰 갱신 or 로그인 리다이렉트 |
| 빈 데이터 (정상 응답)                          | `EmptyBoundary`                        | 안내 문구 UI                   |

---

## 7. 주의 사항

- **Page Suspense는 현재 dormant** — `React.lazy()` 도입 전까지는 `PageLoadingView` 미표시. 코드 스플리팅 적용 시 즉시 활성화
- **중첩 Suspense 우선순위** — 안쪽 Suspense가 먼저 catch. `JobsPage` 내부 Suspense가 `JobListLoadingView` 표시, PageAsyncBoundary의 `PageLoadingView`는 발동 안 함
- **ErrorBoundary reset은 항상 쌍으로** — `QueryErrorResetBoundary.reset` + `ErrorBoundary.reset` 동시 호출해야 query도 재요청됨 (`QueryErrorBoundary` 내부에서 처리됨)
- **Mutation은 boundary 대상 아님** — `throwOnError: false`이므로 반드시 호출부에서 직접 처리
- **StrictMode 이중 호출** — 개발 환경에서 `componentDidCatch`가 두 번 호출되나 프로덕션에서는 정상
