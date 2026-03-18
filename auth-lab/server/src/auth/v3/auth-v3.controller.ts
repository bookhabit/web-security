import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthV3Service } from './auth-v3.service';
import { LoginDto } from '../common/login.dto';

/**
 * V3: JWT → HttpOnly Cookie (SameSite=Lax)
 * ❌ 취약점: SameSite=Lax → 같은 사이트 내 GET 요청에 쿠키 전송
 *   → <img src="/api/user/withdraw"> 태그로 탈퇴 가능
 */
@Controller('auth/v3')
export class AuthV3Controller {
  constructor(private readonly authV3Service: AuthV3Service) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.authV3Service.login(dto);

    // ❌ 취약점: SameSite=Lax → 외부 GET 요청에도 쿠키 전송
    res.cookie('at', accessToken, {
      httpOnly: true,
      secure: false,       // 로컬 HTTP 환경
      sameSite: 'lax',    // ← 취약점: 'strict'가 아님
      maxAge: 1000 * 60 * 60 * 24,
    });

    return { message: '로그인 성공', user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('at');
    return { message: '로그아웃 성공' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies?.['at'];
    if (!token) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.authV3Service.verifyAndGetUser(token);
  }
}
