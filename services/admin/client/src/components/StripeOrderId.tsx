import { cn } from "@/lib/utils";
import { getStripeOrderUrl } from "@/lib/external-links";
import { ExternalDashboardLink } from "@/components/ExternalDashboardLink";

type StripeOrderIdProps = {
    orderId: string;
    className?: string;
};

export function StripeOrderId({ orderId, className }: StripeOrderIdProps) {
    const href = getStripeOrderUrl(orderId);

    return (
        <ExternalDashboardLink
            href={href}
            label={`Paiement Stripe ${orderId}`}>
            <span
                className={cn(
                    "font-mono text-xs text-muted-foreground max-w-40 truncate block",
                    href && "hover:underline cursor-pointer",
                    className,
                )}>
                {orderId}
            </span>
        </ExternalDashboardLink>
    );
}
