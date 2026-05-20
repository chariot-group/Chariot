import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CheckoutDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439012' })
    @IsString()
    @MinLength(1)
    readonly packId: string;

    @ApiProperty({ example: 'Starter Pack' })
    @IsString()
    @MinLength(1)
    readonly displayName: string;
}
