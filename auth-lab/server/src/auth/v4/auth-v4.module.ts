import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../../modules/users/users.module';
import { AuthV4Controller } from './auth-v4.controller';
import { AuthV4Service } from './auth-v4.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthV4Controller],
  providers: [AuthV4Service],
})
export class AuthV4Module {}
