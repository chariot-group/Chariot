import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuickLinkDto {
  @ApiProperty({ example: 'Link' })
  @IsString()
  @IsNotEmpty()
  readonly icon: string;

  @ApiProperty({ example: 'https://example.com' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  readonly url: string;

  @ApiProperty({ example: 'Mon lien' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  readonly label: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  readonly campaignId?: string;
}
