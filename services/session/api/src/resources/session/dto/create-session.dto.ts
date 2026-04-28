import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({
        description: 'ID de la campagne utilisée pour cette session',
        example: 'camp_abc123',
    })
    @IsNotEmpty()
    @IsString()
    campaignId: string;
}
