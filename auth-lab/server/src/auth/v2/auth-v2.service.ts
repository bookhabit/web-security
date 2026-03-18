import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../modules/users/users.service';
import { LoginDto } from '../common/login.dto';

@Injectable()
export class AuthV2Service {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    if (user.isWithdrawn) throw new UnauthorizedException('탈퇴된 계정입니다.');
    return user;
  }

  getProfile(userId: string) {
    return this.usersService.getProfile(userId);
  }
}
