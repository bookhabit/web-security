import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../../modules/users/users.module';
import { AuthV3Controller } from './auth-v3.controller';
import { AuthV3Service } from './auth-v3.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthV3Controller],
  providers: [AuthV3Service],
})
export class AuthV3Module {}
