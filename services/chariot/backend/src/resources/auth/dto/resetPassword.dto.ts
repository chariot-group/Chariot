import { IsEmail, IsLocale } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  readonly email: string;

  @IsLocale()
  readonly locale: string;
}
