import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthV1Service } from './auth-v1.service';
import { LoginDto } from '../common/login.dto';

/**
 * V1: JWT를 Response Body로 반환 (LocalStorage 저장 방식)
 * ❌ 취약점: XSS로 localStorage.getItem('at') → 토큰 탈취 가능
 */
@Controller('auth/v1')
export class AuthV1Controller {
  constructor(private readonly authV1Service: AuthV1Service) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authV1Service.login(dto);
    // 응답: { accessToken: '...' } → 클라이언트가 localStorage에 저장
  }

  @Get('me')
  me(@Req() req: Request) {
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }
    const token = auth.split(' ')[1];
    return this.authV1Service.verifyAndGetUser(token);
  }
}
