import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MasteryDto {

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    athletics?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    acrobatics?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    sleightHand?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    stealth?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    arcana?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    history?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    investigation?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    nature?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    religion?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    animalHandling?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    insight?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    medicine?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    perception?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    survival?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    deception?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    intimidation?: boolean;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    performance?: boolean;

    @ApiProperty({ example: false })
    @IsOptional()
    @IsBoolean()
    persuasion?: boolean;
}
