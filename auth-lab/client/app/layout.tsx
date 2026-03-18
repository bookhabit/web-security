import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { GlobalErrorBoundary } from "@/components/common/error/GlobalErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auth-Lab",
  description: "JWT / Session / Cookie 인증 해킹 & 방어 실습",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          계층 구조:
          ErrorBoundary (Global)   ← JS 런타임 에러 최후 보루
            └─ QueryProvider       ← TanStack Query 컨텍스트
                 └─ children       ← 각 페이지 (PageAsyncBoundary는 페이지에서 사용)
        */}
        <GlobalErrorBoundary>
          <QueryProvider>{children}</QueryProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
