import { Module } from '@nestjs/common';
import { UsersModule } from '../../modules/users/users.module';
import { AuthV2Controller } from './auth-v2.controller';
import { AuthV2Service } from './auth-v2.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthV2Controller],
  providers: [AuthV2Service],
})
export class AuthV2Module {}
