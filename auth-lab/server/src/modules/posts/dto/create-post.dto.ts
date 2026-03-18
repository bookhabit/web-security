import { IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  content: string; // ❌ 의도적 취약점: sanitize 없음
}
