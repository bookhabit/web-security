import { IsEmail, IsInt, Min } from 'class-validator';

export class TransferDto {
  @IsEmail()
  toEmail: string;

  @IsInt()
  @Min(1)
  amount: number;
}
