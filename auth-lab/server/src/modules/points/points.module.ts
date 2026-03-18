import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}), // secret은 verify 시 동적 지정
  ],
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}
