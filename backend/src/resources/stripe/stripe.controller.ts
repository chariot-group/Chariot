import {
    Controller, Post, Req, Res, Headers, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from '@/resources/stripe/stripe.service';
import { Public } from '@/common/decorators/public.decorator';

@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    private readonly CONTROLLER_NAME = StripeController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    @Public()
    @Post('webhook')
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string,
    ) {
        const buf = (req as any).rawBody;

        let event;
        try {
            event = this.stripeService.verifySignature(buf, signature);
        } catch (err) {
            let errorMessage: string = `Webhook signature verification failed: ${err.message}`;
            this.logger.error(errorMessage, err, this.CONTROLLER_NAME);
            return res.status(400).send(errorMessage);
        }

        await this.stripeService.handleEvent(event);

        return res.status(200).json({ received: true });
    }
}