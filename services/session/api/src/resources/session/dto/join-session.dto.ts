import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinSessionDto {
    @ApiProperty({
        description: 'ID du personnage utilisé pour rejoindre la session',
        example: 'char_abc123',
    })
    @IsNotEmpty()
    @IsString()
    characterId: string;
}
