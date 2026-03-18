import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../../modules/users/users.module';
import { AuthV1Controller } from './auth-v1.controller';
import { AuthV1Service } from './auth-v1.service';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthV1Controller],
  providers: [AuthV1Service],
})
export class AuthV1Module {}
