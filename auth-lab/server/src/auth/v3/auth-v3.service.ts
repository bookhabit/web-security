import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../modules/users/users.service';
import { LoginDto } from '../common/login.dto';

@Injectable()
export class AuthV3Service {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    if (user.isWithdrawn) throw new UnauthorizedException('탈퇴된 계정입니다.');

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: '24h' },
    );

    return {
      accessToken,
      user: { id: user.id, email: user.email, points: user.points },
    };
  }

  async verifyAndGetUser(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      return this.usersService.getProfile(payload.sub);
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
