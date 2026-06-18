import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { HistoryDto } from '@/resources/user/dto/sub/history.dto';
import { Type } from 'class-transformer';

export class UserInfoDto {
  @ApiProperty({
    description: 'Keycloak unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  keycloakId: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    pattern: '^https?://.+\\.(jpg|jpeg|png|gif|webp)$',
    required: false,
    nullable: true,
  })
  avatar?: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @ApiProperty({ type: [HistoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryDto)
  history: HistoryDto[];

  @ApiProperty({
    description: 'User preferred UI locale',
    example: 'fr',
    enum: ['fr', 'en', 'es'],
    required: false,
  })
  preferredLocale?: string;

  @ApiProperty({
    description: 'User preferred measurement unit',
    example: 'metric',
    enum: ['metric', 'imperial'],
    required: false,
  })
  preferredMeasurementUnit?: string;

  @ApiProperty({
    description: 'Show both metric and imperial units simultaneously',
    example: false,
    required: false,
  })
  showBothUnits?: boolean;
}
