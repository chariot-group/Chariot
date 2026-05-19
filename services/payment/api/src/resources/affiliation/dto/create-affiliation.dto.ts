import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    MinLength,
    MaxLength,
    IsInt,
    Min,
    Max,
    Matches,
} from 'class-validator';

export class CreateAffiliationDto {
    @ApiProperty({
        description: "Code d'affiliation unique (lettres majuscules, chiffres, tirets)",
        example: 'CREATOR123',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    @Matches(/^[A-Z0-9_-]+$/, {
        message: 'code must contain only uppercase letters, digits, underscores or dashes',
    })
    code: string;

    @ApiProperty({
        description: "Nom descriptif du programme d'affiliation",
        example: 'Affiliation Hugo',
    })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'Keycloak ID du créateur bénéficiaire des commissions',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @MinLength(1)
    creatorUserId: string;

    @ApiProperty({
        description: 'Nom affiché du créateur (pseudo, chaîne YouTube, etc.)',
        example: 'HugoCreates',
    })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    creatorName: string;

    @ApiProperty({
        description: 'Pourcentage de commission reversé au créateur par panier (0-100)',
        example: 10,
    })
    @IsInt()
    @Min(0)
    @Max(100)
    creatorCommissionPercent: number;

    @ApiProperty({
        description: "Pourcentage de réduction accordé à l'utilisateur qui utilise le code (0-100)",
        example: 5,
    })
    @IsInt()
    @Min(0)
    @Max(100)
    userDiscountPercent: number;
}
