import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthV4Service } from './auth-v4.service';
import { LoginDto } from '../common/login.dto';

/**
 * V4: Hybrid Refresh Token
 * ✅ 방어:
 *   - AccessToken → 15분 만료, JSON Body → Zustand 메모리 저장
 *   - RefreshToken → 7일 만료, HttpOnly + SameSite=Strict 쿠키
 *   - 모든 API: Authorization Bearer 헤더 필수 → CSRF 불가
 *   - XSS 시도 시: localStorage 비어있음, 메모리는 접근 불가
 */
@Controller('auth/v4')
export class AuthV4Controller {
  constructor(private readonly authV4Service: AuthV4Service) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authV4Service.login(dto);

    // ✅ RefreshToken: HttpOnly + SameSite=Strict (외부 요청에 쿠키 미전송)
    res.cookie('rt', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict', // ← 방어: 외부 사이트 요청 시 쿠키 미전송
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    });

    // ✅ AccessToken: Body 반환 → 클라이언트 메모리(Zustand)에 저장
    return { accessToken, user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rt = req.cookies?.['rt'];
    if (!rt) throw new UnauthorizedException('Refresh Token이 없습니다.');

    const { accessToken, refreshToken } = await this.authV4Service.refresh(rt);

    // RT Rotation: 새 RT 발급
    res.cookie('rt', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { accessToken };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('rt');
    return { message: '로그아웃 성공' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    // ✅ Authorization 헤더 필수 (쿠키 인증 없음 → CSRF 불가)
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization 헤더가 필요합니다.');
    }
    const token = auth.split(' ')[1];
    return this.authV4Service.verifyAndGetUser(token);
  }
}
