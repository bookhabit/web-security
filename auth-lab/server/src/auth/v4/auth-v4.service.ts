import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../modules/users/users.service';
import { LoginDto } from '../common/login.dto';

@Injectable()
export class AuthV4Service {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get atSecret() { return this.config.get('JWT_ACCESS_SECRET')!; }
  private get rtSecret() { return this.config.get('JWT_REFRESH_SECRET')!; }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    if (user.isWithdrawn) throw new UnauthorizedException('탈퇴된 계정입니다.');

    return {
      ...this.issueTokens(user.id),
      user: { id: user.id, email: user.email, points: user.points },
    };
  }

  async refresh(rt: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(rt, {
        secret: this.rtSecret,
      });
      return this.issueTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('Refresh Token이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

  async verifyAndGetUser(at: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(at, {
        secret: this.atSecret,
      });
      return this.usersService.getProfile(payload.sub);
    } catch {
      throw new UnauthorizedException('Access Token이 유효하지 않습니다.');
    }
  }

  private issueTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { secret: this.atSecret, expiresIn: '15m' }, // ✅ 15분 단기 만료
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { secret: this.rtSecret, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }
}
