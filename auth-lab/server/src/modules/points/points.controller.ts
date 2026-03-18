import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PointsService } from './points.service';
import { TransferDto } from './dto/transfer.dto';

// ❌ V1 전용: 별도 Guard 없이 Authorization 헤더의 JWT를 직접 디코드
// → 훔친 토큰으로도 호출 가능 (의도적 취약점)
import { JwtService } from '@nestjs/jwt';

@Controller('api/points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('transfer')
  async transfer(@Body() dto: TransferDto, @Req() req: Request) {
    // V1: Authorization 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    const token = authHeader.split(' ')[1];
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return this.pointsService.transfer(payload.sub, dto);
  }
}
