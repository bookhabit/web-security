import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthV2Service } from './auth-v2.service';
import { LoginDto } from '../common/login.dto';

/**
 * V2: express-session — HttpOnly 쿠키에 세션 ID 저장
 * ❌ 취약점: CSRF 토큰 없음 → 외부 폼으로 세션 쿠키 자동 전송 가능
 */
@Controller('auth/v2')
export class AuthV2Controller {
  constructor(private readonly authV2Service: AuthV2Service) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authV2Service.validateUser(dto);
    // 세션에 userId 저장
    (req as any).session.userId = user.id;
    return { message: '로그인 성공', user: { id: user.id, email: user.email } };
  }

  @Post('logout')
  logout(@Req() req: Request) {
    return new Promise<{ message: string }>((resolve, reject) => {
      (req as any).session.destroy((err: Error) => {
        if (err) reject(err);
        else resolve({ message: '로그아웃 성공' });
      });
    });
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId: string | undefined = (req as any).session?.userId;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.authV2Service.getProfile(userId);
  }
}
