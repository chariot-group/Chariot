import { IsBoolean, IsOptional } from 'class-validator';

export class MasteryDto {
    @IsOptional()
    @IsBoolean()
    athletics?: boolean;

    @IsOptional()
    @IsBoolean()
    acrobatics?: boolean;

    @IsOptional()
    @IsBoolean()
    sleightHand?: boolean;

    @IsOptional()
    @IsBoolean()
    stealth?: boolean;

    @IsOptional()
    @IsBoolean()
    arcana?: boolean;

    @IsOptional()
    @IsBoolean()
    history?: boolean;

    @IsOptional()
    @IsBoolean()
    investigation?: boolean;

    @IsOptional()
    @IsBoolean()
    nature?: boolean;

    @IsOptional()
    @IsBoolean()
    religion?: boolean;

    @IsOptional()
    @IsBoolean()
    animalHandling?: boolean;

    @IsOptional()
    @IsBoolean()
    insight?: boolean;

    @IsOptional()
    @IsBoolean()
    medicine?: boolean;

    @IsOptional()
    @IsBoolean()
    perception?: boolean;

    @IsOptional()
    @IsBoolean()
    survival?: boolean;

    @IsOptional()
    @IsBoolean()
    deception?: boolean;

    @IsOptional()
    @IsBoolean()
    intimidation?: boolean;

    @IsOptional()
    @IsBoolean()
    performance?: boolean;

    @IsOptional()
    @IsBoolean()
    persuasion?: boolean;
}
