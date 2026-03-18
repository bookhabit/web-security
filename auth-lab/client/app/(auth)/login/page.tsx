import { Navbar } from '@/components/layout/Navbar';
import { LoginContainer } from '@/components/auth/LoginContainer';

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">로그인</h1>
          <p className="mt-1 text-sm text-gray-500">
            상단 탭에서 인증 방식을 변경하면 취약점을 비교할 수 있습니다.
          </p>
        </div>
        <LoginContainer />
      </main>
    </>
  );
}
