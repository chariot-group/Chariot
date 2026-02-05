import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class MasteryDto {

    @ApiProperty({ example: 3 })
    @IsNumber()
    athletics: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    acrobatics: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    sleightHand: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    stealth: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    arcana: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    history: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    investigation: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    nature: number;

    @ApiProperty({ example: 3 })
    @IsNumber()
    religion: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    animalHandling: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    insight: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    medicine: number;

    @ApiProperty({ example: 2 })
    @IsNumber()
    perception: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    survival: number;

    @ApiProperty({ example: 3 })
    @IsNumber()
    deception: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    intimidation: number;

    @ApiProperty({ example: 2 })
    @IsNumber()
    performance: number;

    @ApiProperty({ example: 0 })
    @IsNumber()
    persuasion: number;
}
