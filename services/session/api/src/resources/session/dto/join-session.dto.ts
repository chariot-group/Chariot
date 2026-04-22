import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinSessionDto {
    @ApiPropertyOptional({
        description: 'ID du personnage utilisé pour rejoindre la session (null pour le Maître du Jeu)',
        example: 'char_abc123',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    characterId?: string | null;
}
