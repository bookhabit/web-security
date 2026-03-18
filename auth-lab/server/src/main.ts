import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── 전역 파이프: DTO 검증 ────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ── Cookie 파서 ──────────────────────────────────────────────
  app.use(cookieParser());

  // ── Express Session (V2 세션 방식에서 사용) ──────────────────
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax', // ❌ 취약점: 'strict'가 아니므로 CSRF 가능
        maxAge: 1000 * 60 * 60 * 24, // 1일
      },
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js 클라이언트
      'http://localhost:5000', // hacker CSRF 페이지 (의도적 허용)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.PORT ?? 4001;
  await app.listen(port);
  console.log(`\n🚀 Auth-Lab Server running on http://localhost:${port}`);
  console.log(`   POST /api/points/transfer  — 1단계: 포인트 송금`);
  console.log(`   POST /api/user/update-password — 2단계: 비밀번호 변경`);
  console.log(`   GET  /api/user/withdraw    — 3단계: 회원 탈퇴\n`);
}
bootstrap();
