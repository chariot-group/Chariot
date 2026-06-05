const keycloakAdminUrl = process.env.NEXT_PUBLIC_KEYCLOAK_ADMIN_URL?.trim();
const keycloakRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM?.trim() ?? "chariot";
const stripeDashboardUrl = process.env.NEXT_PUBLIC_STRIPE_DASHBOARD_URL?.trim();

function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, "");
}

export function buildKeycloakUserUrl(adminUrl: string | undefined, realm: string, userId: string): string | null {
    const trimmedUserId = userId.trim();
    const trimmedAdminUrl = adminUrl?.trim();
    const trimmedRealm = realm.trim();

    if (!trimmedAdminUrl || !trimmedUserId || !trimmedRealm) return null;

    const base = trimTrailingSlash(trimmedAdminUrl);
    return `${base}/master/console/#/${trimmedRealm}/users/${trimmedUserId}/settings`;
}

export function buildStripeOrderUrl(dashboardUrl: string | undefined, orderId: string): string | null {
    const trimmedOrderId = orderId.trim();
    const trimmedDashboardUrl = dashboardUrl?.trim();

    if (!trimmedDashboardUrl || !trimmedOrderId) return null;

    const base = trimTrailingSlash(trimmedDashboardUrl);

    if (trimmedOrderId.startsWith("cs_")) {
        return `${base}/checkout/sessions/${trimmedOrderId}`;
    }
    if (trimmedOrderId.startsWith("pi_")) {
        return `${base}/payments/${trimmedOrderId}`;
    }

    return `${base}/search?query=${encodeURIComponent(trimmedOrderId)}`;
}

export function getKeycloakUserUrl(userId: string): string | null {
    return buildKeycloakUserUrl(keycloakAdminUrl, keycloakRealm, userId);
}

export function getStripeOrderUrl(orderId: string): string | null {
    return buildStripeOrderUrl(stripeDashboardUrl, orderId);
}
