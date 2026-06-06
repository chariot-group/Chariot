import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CheckoutDto } from '@/resources/stripe/dto/checkout.dto';

export class EmbeddedCheckoutDto extends CheckoutDto {
    @ApiPropertyOptional({ example: 'fr', description: "Locale utilisée pour construire l'URL de retour" })
    @IsOptional()
    @IsString()
    readonly locale?: string;
}
