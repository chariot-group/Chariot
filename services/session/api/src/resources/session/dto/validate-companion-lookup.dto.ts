import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsMongoId } from 'class-validator';

/** @see FR-session-player-companion-combatants */
export class ValidateCompanionLookupDto {
    @ApiProperty({
        description: 'Assigned non-GM player character ids whose linked NPCs will be listed',
        type: [String],
    })
    @IsArray()
    @ArrayMaxSize(100)
    @IsMongoId({ each: true })
    playerIds: string[];
}
