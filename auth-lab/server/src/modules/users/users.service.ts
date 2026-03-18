import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, email: true, points: true, role: true, isWithdrawn: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  // ❌ V2 CSRF 취약점: oldPassword 확인 없음
  async updatePassword(userId: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { message: '비밀번호가 변경되었습니다.' };
  }

  // ❌ V3 GET CSRF 취약점: GET 방식으로 호출되는 탈퇴 API
  async withdraw(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    if (user.isWithdrawn) throw new BadRequestException('이미 탈퇴된 계정입니다.');

    user.isWithdrawn = true;
    await this.userRepo.save(user);
    return { message: '탈퇴되었습니다.' };
  }
}
