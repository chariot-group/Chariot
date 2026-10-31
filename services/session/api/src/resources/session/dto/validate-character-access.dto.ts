import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

export enum SessionCharacterAccessMode {
    RosterRead = 'roster-read',
    GmEdit = 'gm-edit',
}

export class ValidateCharacterAccessDto {
    @ApiProperty({ description: 'MongoDB id of the character' })
    @IsMongoId()
    characterId: string;

    @ApiProperty({ enum: SessionCharacterAccessMode })
    @IsEnum(SessionCharacterAccessMode)
    mode: SessionCharacterAccessMode;

    /** @see FR-session-player-companion-combatants — NPC `linkedPlayerId` from Adventure, not the client. */
    @ApiPropertyOptional({ description: 'Linked Player id when the character is a companion NPC' })
    @IsOptional()
    @IsMongoId()
    linkedPlayerId?: string;
}
