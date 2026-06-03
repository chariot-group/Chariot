import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class InitReferralDto {
    @ApiPropertyOptional({
        description: 'Code de parrainage reçu (optionnel - si fourni, lie cet utilisateur comme filleul)',
        example: 'ABCD1234',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(16)
    referralCode?: string;
}
