# Frontend Architecture Rules (SRP + Layered Structure)

> 이 문서는 프론트엔드 개발 시 **항상 지켜야 하는 아키텍처 규칙**을 정의한다.
> 모든 화면 구현, API 연동, 폼 처리 시 본 규칙을 기준으로 구조를 설계한다.

---

# 1. 단일 책임 원칙 (Single Responsibility Principle)

## ✅ 레이어별 책임 분리

- 데이터 정의
- 네트워크 통신
- 서버 상태 관리
- 비즈니스 로직
- UI 표현

---

## ✅ 역할 고정 규칙

- **Zod → 검증만**
- **Service → 통신만**
- **Query → 서버 상태만**
- **Form Hook → 입력 관리만**
- **Component → 화면 표현만**

각 레이어는 자신의 역할 외의 일을 절대 수행하지 않는다.

---

# 2. 아키텍처 핵심 원칙

---

## 1️⃣ UI는 비즈니스 로직을 모른다

UI 컴포넌트는 아래만 알아야 한다.

- 어떤 props를 받는지
- 어떻게 보여줄지

그 외의 모든 것:

- API 호출
- 데이터 가공
- 상태 관리
- 비즈니스 규칙

👉 절대 포함 금지

---

## 2️⃣ 비즈니스 로직은 화면을 모른다

Hook / Service 는 아래만 알아야 한다.

- 데이터 구조
- 처리 방법

절대 알면 안 되는 것:

- JSX 구조
- CSS
- layout
- component hierarchy

---

## 3️⃣ 네트워크 계층은 React를 모른다

Service 레이어 규칙:

- React import 금지
- Hook 사용 금지
- 상태 관리 금지

👉 반드시 **순수 함수**여야 한다.

---

# 3. 전체 데이터 흐름 구조

```
[Schema]
    ↓
[Service]
    ↓
[Data Hook]
    ↓
[Logic Hook]
    ↓
[Container]
    ↓
[View]
```

---

# 4. POST API 구조 (Form + Mutation)

## 📌 레이어 구조

| Layer      | 책임                | 도구            |
| ---------- | ------------------- | --------------- |
| Schema     | 입력 데이터 검증    | Zod             |
| Service    | API 호출            | fetch / axios   |
| Data Hook  | 서버 상태 관리      | TanStack Query  |
| Logic Hook | 폼 상태 + 서버 연결 | React Hook Form |
| Component  | UI                  | React           |

---

## 📌 POST 데이터 흐름

```
사용자 입력
  ↓
React Hook Form
  ↓
Zod 검증
  ↓
Mutation 실행
  ↓
Service 호출
  ↓
성공 / 실패 처리
  ↓
UI 업데이트
```

---

# 5. GET API 구조

## 📌 레이어 구조

| Layer      | 책임                            | 도구            | 설명                     |
| ---------- | ------------------------------- | --------------- | ------------------------ |
| Schema     | 데이터 구조 정의 및 런타임 검증 | Zod, TypeScript | 서버 응답 검증           |
| Service    | 순수 네트워크 요청              | fetch / axios   | React와 무관한 순수 함수 |
| Data Hook  | 서버 상태 관리                  | TanStack Query  | 캐싱, 로딩, 에러 관리    |
| Logic Hook | 비즈니스 로직 가공              | Custom Hook     | 데이터 변환, 계산        |
| Container  | 로직 → UI 연결                  | React Component | 상태 분기 및 데이터 전달 |
| View       | UI 표현                         | React, CSS      | 순수 UI                  |

---

## 📌 GET 데이터 흐름

```
API 호출
  ↓
Service
  ↓
Schema 검증
  ↓
TanStack Query 캐싱
  ↓
Container 상태 분기
  ↓
View 렌더링
```

---

# 6. 절대 금지 규칙 (VERY IMPORTANT)

## ❌ Component 내부에서 직접 fetch 호출 금지

반드시 Service → Query → Hook 경유.

---

## ❌ Service 내부에서 React Hook 사용 금지

Service는 순수 TS 파일.

---

## ❌ View 컴포넌트에서 상태 로직 작성 금지

View는 props 렌더링만 한다.

---

## ❌ Zod 없이 서버 응답 사용 금지

모든 API 응답은 Schema 검증 필수.

---

# 7. 구현 체크리스트 (PR 제출 전 확인)

## 화면 생성 시

- [ ] schema 존재
- [ ] service 존재
- [ ] query hook 존재
- [ ] logic hook 필요 여부 검토
- [ ] container 존재
- [ ] view 분리 완료

---

## POST 폼 구현 시

- [ ] zod schema 작성
- [ ] react-hook-form 사용
- [ ] mutation hook 분리
- [ ] service 분리
- [ ] UI에서 API 직접 호출 없음

---

# 8. 폴더 구조 기준

```
src/
 ├── schemas/
 ├── services/
 ├── hooks/
 ├── components/
 │    ├── container/
 │    └── view/
 └── pages/
```

---

# 9. 이 규칙의 목적

이 구조는 다음을 보장한다:

- UI 변경 시 로직 영향 없음
- API 변경 시 UI 영향 최소화
- 테스트 가능 구조 유지
- 대규모 확장 가능
- 협업 시 충돌 최소화

---

# ✅ 최종 원칙 (한 줄 요약)

> UI는 보여주기만 한다
> Hook은 처리만 한다
> Service는 호출만 한다
> Schema는 검증만 한다

이 규칙은 모든 신규 코드 작성 시 반드시 준수한다.

# EXAMPLE 1 : form

- 1. 스키마 및 타입 정의 (`src/schemas/authSchema.ts`)
     데이터의 구조와 검증 규칙을 한곳에서 관리합니다.

  ```tsx
  import { z } from 'zod';

  export const registerSchema = z.object({
    email: z.string().email("이메일 형식이 올바르지 않습니다."),
    password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

  export type RegisterInput = z.infer<typeof registerSchema>;
  ```

- 2. 서비스 레이어 (`src/services/authService.ts`)
     순수하게 네트워크 통신만 담당합니다.

  ```tsx
  import { RegisterInput } from '../schemas/authSchema';

  export const authService = {
    register: async (data: RegisterInput) => {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData; // 서버에서 보낸 에러 객체 (ex: { code: 'EMAIL_ALREADY_EXISTS' })
      }
      return response.json();
    }
  };
  ```

- 3. 서버 상태 관리 훅 (`src/hooks/queries/useAuthMutation.ts`)
     TanStack Query를 사용해 API 상태를 래핑합니다.

  ```tsx
  import { useMutation } from '@tanstack/react-query';
  import { authService } from '../../services/authService';

  export function useRegisterMutation() {
    return useMutation({
      mutationFn: authService.register,
    });
  }
  ```

- 4. 비즈니스 로직 훅 (`src/hooks/useRegisterForm.ts`)
     폼 관리와 서버 통신 로직을 결합하여 UI에 전달할 데이터를 준비합니다.

  ```tsx
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { registerSchema, RegisterInput } from '../schemas/authSchema';
  import { useRegisterMutation } from './queries/useAuthMutation';

  export function useRegisterForm() {
    const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterInput>({
      resolver: zodResolver(registerSchema),
      mode: 'onBlur'
    });

    const { mutate, isPending } = useRegisterMutation();

    const onSubmit = (data: RegisterInput) => {
      mutate(data, {
        onSuccess: () => alert("가입을 환영합니다!"),
        onError: (error: any) => {
          if (error.code === 'EMAIL_ALREADY_EXISTS') {
            setError("email", { message: "이미 사용 중인 이메일입니다." });
          } else {
            setError("root.serverError", { message: "서버 오류가 발생했습니다." });
          }
        }
      });
    };

    return {
      register,
      handleSubmit: handleSubmit(onSubmit),
      errors,
      isLoading: isPending
    };
  }
  ```

- 5. UI 컴포넌트 (`src/components/RegisterForm.tsx`)
     로직은 전혀 신경 쓰지 않고, 오직 데이터 바인딩과 스타일링에만 집중합니다.

  ```tsx
  import { useRegisterForm } from '../hooks/useRegisterForm';

  export function RegisterForm() {
    const { register, handleSubmit, errors, isLoading } = useRegisterForm();

    return (
      <form onSubmit={handleSubmit} className="form-container">
        <h2>회원가입</h2>

        <div className="input-group">
          <label>이메일</label>
          <input {...register("email")} placeholder="example@test.com" />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="input-group">
          <label>비밀번호</label>
          <input type="password" {...register("password")} placeholder="8자 이상 입력" />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        <div className="input-group">
          <label>비밀번호 확인</label>
          <input type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
        </div>

        {errors.root?.serverError && (
          <div className="alert-error">{errors.root.serverError.message}</div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "처리 중..." : "계정 생성"}
        </button>
      </form>
    );
  }
  ```

- 6. 최종 루트 컴포넌트 (`src/pages/RegisterPage.tsx`)
  - 레이아웃 배치와 데이터 흐름 연결만 담당

  ```tsx
  // src/pages/RegisterPage.tsx
  import { Banner } from '../components/common/Banner';
  import { Sidebar } from '../components/layout/Sidebar';
  import { RegisterForm } from '../components/auth/RegisterForm';

  export default function RegisterPage() {

    return (
      <div className="page-layout">
        <header>
          <Banner title="회원가입하고 혜택을 받으세요!" />
        </header>

        <main style={{ display: 'flex' }}>
          <aside>
            <Sidebar items={['가입 안내', '약관 동의', '도움말']} />
          </aside>

          <section className="content">
            <h2>회원정보 입력</h2>
            {/* 복잡한 폼 컴포넌트 */}
            **<RegisterForm />**

            {/* 폼 외의 다른 UI들 */}
            <div className="info-box">
              <h3>자주 묻는 질문</h3>
              <p>이미 계정이 있으신가요? <a href="/login">로그인하기</a></p>
            </div>
          </section>
        </main>

        <footer>
          <p>© 2026 My Awesome Project. All rights reserved.</p>
        </footer>
      </div>
    );
  }
  ```

# EXAMPLE 2 : get list

- 1. 스키마 정의 (`src/schemas/userSchema.ts`)
  서버에서 오는 데이터가 우리가 기대한 형태인지 검증하고 타입을 추출합니다.
  ```tsx
  import { z } from 'zod';

  // 단일 사용자 스키마
  export const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    website: z.string().url(),
  });

  // 사용자 리스트 스키마 (배열)
  export const userListSchema = z.array(userSchema);

  export type User = z.infer<typeof userSchema>;
  ```
- 2. 서비스 레이어 (`src/services/userService.ts`)
  순수하게 네트워크 요청과 데이터 검증만 수행합니다.
  ```tsx
  import { userListSchema, User } from '../schemas/userSchema';

  export const userService = {
    getUsers: async (): Promise<User[]> => {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');

      if (!response.ok) throw new Error('데이터 로드 실패');

      const data = await response.json();

      // Zod를 사용하여 서버 응답 데이터가 스키마와 일치하는지 검증 (런타임 안정성)
      return userListSchema.parse(data);
    }
  };
  ```
- 3. 서버 상태 관리 훅 (`src/hooks/queries/useUserQuery.ts`)
  TanStack Query를 통해 캐싱, 로딩, 에러 상태를 래핑합니다.
  ```tsx
  import { useQuery } from '@tanstack/react-query';
  import { userService } from '../../services/userService';

  export function useUserQuery() {
    return useQuery({
      queryKey: ['users'], // 캐시 키
      queryFn: userService.getUsers,
      staleTime: 1000 * 60 * 5, // 5분 동안 데이터를 '신선'하다고 판단 (캐싱 최적화)
    });
  }
  ```
- 4. UI 컴포넌트 분리
  데이터 로직을 처리하는 **Container**와 화면만 그리는 **Presenter**로 나눕니다.
  - 데이터 로직을 처리하는 **Container**
    [4-1] 비즈니스 로직 연결 (`src/components/user/UserListContainer.tsx`)
    ```tsx
    import { useUserQuery } from '../../hooks/queries/useUserQuery';
    import { UserListView } from './UserListView';

    export function UserListContainer() {
      const { data: users, isLoading, isError, error, refetch } = useUserQuery();

      // 로딩 상태 처리
      if (isLoading) return <div className="spinner">데이터를 불러오는 중...</div>;

      // 에러 상태 처리
      if (isError) return (
        <div className="error-box">
          <p>에러 발생: {(error as Error).message}</p>
          <button onClick={() => refetch()}>다시 시도</button>
        </div>
      );

      // 성공 상태: 데이터 전송
      return <UserListView users={users ?? []} />;
    }
    ```
  - 화면만 그리는 **Presenter**
    [4-2] 순수 UI 컴포넌트 (`src/components/user/UserListView.tsx`)
    ```tsx
    import { User } from '../../schemas/userSchema';

    interface Props {
      users: User[];
    }

    export function UserListView({ users }: Props) {
      return (
        <div className="user-list-wrapper">
          <h2>사용자 목록 ({users.length}명)</h2>
          <ul>
            {users.map((user) => (
              <li key={user.id} className="user-card">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{user.website}</small>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    ```
