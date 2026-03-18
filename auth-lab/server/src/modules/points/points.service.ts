import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async transfer(fromUserId: string, dto: TransferDto) {
    const { toEmail, amount } = dto;

    await this.dataSource.transaction(async (manager) => {
      const from = await manager.findOne(User, { where: { id: fromUserId } });
      const to = await manager.findOne(User, { where: { email: toEmail } });

      if (!from) throw new NotFoundException('송신자를 찾을 수 없습니다.');
      if (!to) throw new NotFoundException(`${toEmail} 계정을 찾을 수 없습니다.`);
      if (from.id === to.id) throw new BadRequestException('자기 자신에게 송금할 수 없습니다.');
      if (from.points < amount) throw new BadRequestException('잔액이 부족합니다.');

      from.points -= amount;
      to.points += amount;

      await manager.save([from, to]);
    });

    const [updated_from, updated_to] = await Promise.all([
      this.userRepo.findOne({ where: { id: fromUserId } }),
      this.userRepo.findOne({ where: { email: toEmail } }),
    ]);

    return {
      message: `${amount.toLocaleString()}포인트 송금 완료`,
      from: { email: updated_from!.email, points: updated_from!.points },
      to:   { email: updated_to!.email,   points: updated_to!.points },
    };
  }
}
