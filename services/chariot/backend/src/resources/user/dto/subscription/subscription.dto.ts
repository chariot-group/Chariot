import { IsDateString, IsString } from "class-validator";

export class SubscriptionDto {
    @IsString()
    readonly id: string;

    @IsDateString()
    readonly expired_at: Date;

    @IsDateString()
    readonly started_at: Date;

    @IsString()
    readonly productId: string;

    @IsString()
    readonly priceId: string;
}