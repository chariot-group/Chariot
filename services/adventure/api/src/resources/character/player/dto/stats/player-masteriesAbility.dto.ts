import { IsBoolean, IsOptional } from 'class-validator';

export class MasteriesAbilityDto {
    @IsOptional()
    @IsBoolean()
    strength?: boolean;

    @IsOptional()
    @IsBoolean()
    dexterity?: boolean;

    @IsOptional()
    @IsBoolean()
    constitution?: boolean;

    @IsOptional()
    @IsBoolean()
    intelligence?: boolean;

    @IsOptional()
    @IsBoolean()
    wisdom?: boolean;

    @IsOptional()
    @IsBoolean()
    charisma?: boolean;
}
