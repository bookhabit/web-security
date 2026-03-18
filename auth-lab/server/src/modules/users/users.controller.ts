import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('api/user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ────────────────────────────────────────────────────────────
  // V2: POST /api/user/update-password
  // ❌ 취약점: CSRF 토큰 없음 + oldPassword 확인 없음
  //   → 낚시 사이트의 숨겨진 폼으로 공격 가능
  // ────────────────────────────────────────────────────────────
  @Post('update-password')
  async updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: Request) {
    const session = (req as any).session;
    const userId: string | undefined = session?.userId;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');

    return this.usersService.updatePassword(userId, dto.newPassword);
  }

  // ────────────────────────────────────────────────────────────
  // V3: GET /api/user/withdraw
  // ❌ 취약점: GET 방식 + SameSite=Lax 쿠키
  //   → <img src="..."> 태그만으로 탈퇴 실행 가능
  // ────────────────────────────────────────────────────────────
  @Get('withdraw')
  async withdraw(@Req() req: Request) {
    const token = req.cookies?.['at'];
    if (!token) throw new UnauthorizedException('로그인이 필요합니다.');

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return this.usersService.withdraw(payload.sub);
  }

  // ────────────────────────────────────────────────────────────
  // 공통: GET /api/user/me (버전별 인증으로 호출)
  // ────────────────────────────────────────────────────────────
  @Get('me')
  async me(@Req() req: Request) {
    const userId = this.resolveUserId(req);
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.usersService.getProfile(userId);
  }

  private resolveUserId(req: Request): string | null {
    // V1/V3/V4: Authorization 헤더
    const auth = req.headers['authorization'];
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.split(' ')[1];
        const p = this.jwtService.verify<{ sub: string }>(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        return p.sub;
      } catch { /* fall through */ }
    }
    // V3: at 쿠키
    const cookieToken = req.cookies?.['at'];
    if (cookieToken) {
      try {
        const p = this.jwtService.verify<{ sub: string }>(cookieToken, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        return p.sub;
      } catch { /* fall through */ }
    }
    // V2: 세션
    return (req as any).session?.userId ?? null;
  }
}
