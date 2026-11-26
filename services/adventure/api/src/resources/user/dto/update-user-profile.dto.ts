import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_MIN_LENGTH,
  PERSON_NAME_PATTERN,
  cleanPersonName,
} from '@/common/person-name/person-name';

/** Validates the cleaned value, so padded input is measured after trimming. */
const CleanPersonName = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? cleanPersonName(value) : value,
  );

export const SUPPORTED_USER_LOCALES = ['fr', 'en', 'es'] as const;
export type SupportedUserLocale = (typeof SUPPORTED_USER_LOCALES)[number];

export const SUPPORTED_MEASUREMENT_UNITS = ['metric', 'imperial'] as const;
export type SupportedMeasurementUnit =
  (typeof SUPPORTED_MEASUREMENT_UNITS)[number];

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
    minLength: PERSON_NAME_MIN_LENGTH,
    maxLength: PERSON_NAME_MAX_LENGTH,
  })
  @IsOptional()
  @CleanPersonName()
  @IsString()
  @MinLength(PERSON_NAME_MIN_LENGTH, {
    message: 'First name must not be empty',
  })
  @MaxLength(PERSON_NAME_MAX_LENGTH, {
    message: 'First name must be at most 50 characters long',
  })
  @Matches(PERSON_NAME_PATTERN, {
    message:
      'First name may only contain letters, spaces, apostrophes and hyphens',
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
    minLength: PERSON_NAME_MIN_LENGTH,
    maxLength: PERSON_NAME_MAX_LENGTH,
  })
  @IsOptional()
  @CleanPersonName()
  @IsString()
  @MinLength(PERSON_NAME_MIN_LENGTH, {
    message: 'Last name must not be empty',
  })
  @MaxLength(PERSON_NAME_MAX_LENGTH, {
    message: 'Last name must be at most 50 characters long',
  })
  @Matches(PERSON_NAME_PATTERN, {
    message:
      'Last name may only contain letters, spaces, apostrophes and hyphens',
  })
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

  @ApiProperty({
    description: 'User preferred measurement unit',
    example: 'metric',
    enum: SUPPORTED_MEASUREMENT_UNITS,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_MEASUREMENT_UNITS, {
    message: 'Preferred measurement unit must be one of: metric, imperial',
  })
  preferredMeasurementUnit?: SupportedMeasurementUnit;

  @ApiProperty({
    description: 'Show both metric and imperial units simultaneously',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showBothUnits?: boolean;
}
