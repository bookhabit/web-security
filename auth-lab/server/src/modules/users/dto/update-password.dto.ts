import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(4)
  newPassword: string;
  // ❌ oldPassword 없음 — CSRF 공격 허용 (의도적 취약점)
}
