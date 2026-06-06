import { cn } from "@/lib/utils";
import { getKeycloakUserUrl } from "@/lib/external-links";
import { ExternalDashboardLink } from "@/components/ExternalDashboardLink";

type KeycloakUserIdProps = {
    userId: string;
    className?: string;
};

export function KeycloakUserId({ userId, className }: KeycloakUserIdProps) {
    const href = getKeycloakUserUrl(userId);

    return (
        <ExternalDashboardLink
            href={href}
            label={`Utilisateur Keycloak ${userId}`}
            className="block w-full max-w-36">
            <code
                className={cn(
                    "text-xs text-muted-foreground truncate block",
                    href && "hover:underline cursor-pointer",
                    className,
                )}>
                {userId}
            </code>
        </ExternalDashboardLink>
    );
}
