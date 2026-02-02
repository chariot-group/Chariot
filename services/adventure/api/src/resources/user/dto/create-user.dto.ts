import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { HistoryDto } from '@/resources/user/dto/sub/history.dto';

export class CreateUserDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
    @IsNotEmpty()
    @IsUUID(4)
    @IsString()
    keycloakId: string;

    @ApiProperty({ example: 500 })
    @IsNotEmpty()
    @IsNumber()
    balance: number;

    @ApiProperty({ type: [HistoryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HistoryDto)
    history: HistoryDto[];
}
