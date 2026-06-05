import assert from "node:assert/strict";
import { describe, it } from "node:test";

function getPromoCodeDeactivatePath(id) {
    return `/promo-codes/${id}/deactivate`;
}

function getPromoCodeReactivatePath(id) {
    return `/promo-codes/${id}`;
}

const PROMO_CODE_REACTIVATE_PAYLOAD = { isActive: true };

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
