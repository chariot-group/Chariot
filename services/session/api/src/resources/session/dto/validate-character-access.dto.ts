import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';

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
}
