import { cn } from "@/lib/utils";

type ExternalDashboardLinkProps = {
    href: string | null;
    label: string;
    children: React.ReactNode;
    className?: string;
};

export function ExternalDashboardLink({ href, label, children, className }: ExternalDashboardLinkProps) {
    if (!href) {
        return <>{children}</>;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} (ouvre un nouvel onglet)`}
            className={cn("inline-block transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm", className)}>
            {children}
        </a>
    );
}
