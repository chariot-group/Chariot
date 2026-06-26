import assert from "node:assert/strict";
import { describe, it } from "node:test";

function getPromoCodeDeactivatePath(id) {
    return `/promo-codes/${id}/deactivate`;
}

function getPromoCodeReactivatePath(id) {
    return `/promo-codes/${id}`;
}

const PROMO_CODE_REACTIVATE_PAYLOAD = { isActive: true };

function isPromoCodeExpired(expiresAt, now = new Date()) {
    if (!expiresAt) return false;
    return now > new Date(expiresAt);
}

function isPromoCodeEffectivelyActive(promo, now = new Date()) {
    return promo.isActive && !isPromoCodeExpired(promo.expiresAt, now);
}

function sortPromoCodesByStatus(promoCodes) {
    return [...promoCodes].sort(
        (a, b) => Number(isPromoCodeEffectivelyActive(b)) - Number(isPromoCodeEffectivelyActive(a)),
    );
}

describe("FR-admin-promo-expiration-display", () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    const futureExpiry = "2026-12-31T00:00:00.000Z";
    const pastExpiry = "2026-01-01T00:00:00.000Z";

    it("treats active code with future expiry as effectively active", () => {
        assert.equal(
            isPromoCodeEffectivelyActive({ isActive: true, expiresAt: futureExpiry }, now),
            true,
        );
    });

    it("treats active code with past expiry as effectively inactive", () => {
        assert.equal(
            isPromoCodeEffectivelyActive({ isActive: true, expiresAt: pastExpiry }, now),
            false,
        );
    });

    it("does not treat null expiry as expired", () => {
        assert.equal(isPromoCodeExpired(null, now), false);
        assert.equal(isPromoCodeEffectivelyActive({ isActive: true, expiresAt: null }, now), true);
    });

    it("sorts by effective status, grouping expired with manually inactive codes", () => {
        const active = { isActive: true, expiresAt: futureExpiry };
        const expired = { isActive: true, expiresAt: pastExpiry };
        const inactive = { isActive: false, expiresAt: futureExpiry };

        const sorted = sortPromoCodesByStatus([inactive, expired, active]);
        assert.deepEqual(sorted, [active, inactive, expired]);
    });
});

describe("getPromoCodeDeactivatePath", () => {
    it("returns the PATCH deactivate path for a valid promo code id", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        assert.equal(getPromoCodeDeactivatePath(id), `/promo-codes/${id}/deactivate`);
    });

    it("does not use the DELETE soft-delete endpoint", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        const path = getPromoCodeDeactivatePath(id);
        assert.notEqual(path, `/promo-codes/${id}`);
        assert.ok(path.endsWith("/deactivate"));
    });
});

describe("getPromoCodeReactivatePath", () => {
    it("returns the PATCH update path for reactivation", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        assert.equal(getPromoCodeReactivatePath(id), `/promo-codes/${id}`);
    });

    it("uses isActive true payload for reactivation", () => {
        assert.deepEqual(PROMO_CODE_REACTIVATE_PAYLOAD, { isActive: true });
    });
});
