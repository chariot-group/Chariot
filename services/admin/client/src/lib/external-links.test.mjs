import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirrors buildKeycloakUserUrl / buildStripeOrderUrl for unit tests without a TS runner.
function trimTrailingSlash(url) {
    return url.replace(/\/+$/, "");
}

function buildKeycloakUserUrl(adminUrl, realm, userId) {
    const trimmedUserId = userId.trim();
    const trimmedAdminUrl = adminUrl?.trim();
    const trimmedRealm = realm.trim();

    if (!trimmedAdminUrl || !trimmedUserId || !trimmedRealm) return null;

    const base = trimTrailingSlash(trimmedAdminUrl);
    return `${base}/master/console/#/${trimmedRealm}/users/${trimmedUserId}`;
}

function buildStripeOrderUrl(dashboardUrl, orderId) {
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

describe("buildKeycloakUserUrl", () => {
    it("builds a user deep link from admin URL and realm", () => {
        const url = buildKeycloakUserUrl(
            "http://localhost:8080/auth/admin",
            "chariot",
            "abc-123",
        );
        assert.equal(url, "http://localhost:8080/auth/admin/master/console/#/chariot/users/abc-123");
    });

    it("returns null when admin URL is missing", () => {
        assert.equal(buildKeycloakUserUrl(undefined, "chariot", "abc-123"), null);
    });

    it("returns null when user ID is empty", () => {
        assert.equal(buildKeycloakUserUrl("http://localhost:8080/auth/admin", "chariot", "  "), null);
    });
});

describe("buildStripeOrderUrl", () => {
    it("builds a checkout session link", () => {
        const url = buildStripeOrderUrl("https://dashboard.stripe.com/test", "cs_test_abc");
        assert.equal(url, "https://dashboard.stripe.com/test/checkout/sessions/cs_test_abc");
    });

    it("builds a payment intent link", () => {
        const url = buildStripeOrderUrl("https://dashboard.stripe.com/test", "pi_test_abc");
        assert.equal(url, "https://dashboard.stripe.com/test/payments/pi_test_abc");
    });

    it("falls back to dashboard search for unknown prefixes", () => {
        const url = buildStripeOrderUrl("https://dashboard.stripe.com", "unknown_id");
        assert.equal(url, "https://dashboard.stripe.com/search?query=unknown_id");
    });

    it("returns null when dashboard URL is missing", () => {
        assert.equal(buildStripeOrderUrl(undefined, "pi_test_abc"), null);
    });
});
