import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const SUPPORTED_USER_LOCALES = ['fr', 'en', 'es'] as const;
export type SupportedUserLocale = (typeof SUPPORTED_USER_LOCALES)[number];

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  lastName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'User preferred UI locale',
    example: 'fr',
    enum: SUPPORTED_USER_LOCALES,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_USER_LOCALES, {
    message: 'Preferred locale must be one of: fr, en, es',
  })
  preferredLocale?: SupportedUserLocale;
}
