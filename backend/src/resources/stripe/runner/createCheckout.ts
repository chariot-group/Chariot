import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {

    const API_VERSION = '2025-05-28.basil';
    const SERVICE_NAME: string = 'STRIPE-CHECKOUT';

    dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
        apiVersion: API_VERSION,
    });

    const session = await stripe.checkout.sessions.create(
        {
            mode: "subscription",
            billing_address_collection: "required",
            line_items: [
                {
                    price: "price_1ReH7CQCTCYypKV7WGEcZMPe",
                    quantity: 1,
                },
            ],
            success_url: `${process.env.LANDING_PAGE_URL}/success/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.LANDING_PAGE_URL}/cancel`,
            custom_fields: [
                {
                    key: "pseudo",
                    label: {
                        type: "custom",
                        custom: "Pseudo",
                    },
                    type: "text",
                    text: {
                        minimum_length: 1,
                        maximum_length: 50,
                    },
                    optional: false,
                },
            ],
        });

    Logger.log(`👉 URL Checkout: ${session.url}`, SERVICE_NAME);
}

bootstrap();