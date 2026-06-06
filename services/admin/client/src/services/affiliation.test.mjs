import assert from "node:assert/strict";
import { describe, it } from "node:test";

function getAffiliationDeactivatePath(id) {
    return `/affiliations/${id}/deactivate`;
}

function getAffiliationReactivatePath(id) {
    return `/affiliations/${id}`;
}

const AFFILIATION_REACTIVATE_PAYLOAD = { isActive: true };

describe("getAffiliationDeactivatePath", () => {
    it("returns the PATCH deactivate path for a valid affiliation id", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        assert.equal(getAffiliationDeactivatePath(id), `/affiliations/${id}/deactivate`);
    });

    it("does not use the DELETE soft-delete endpoint", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        const path = getAffiliationDeactivatePath(id);
        assert.notEqual(path, `/affiliations/${id}`);
        assert.ok(path.endsWith("/deactivate"));
    });
});

describe("getAffiliationReactivatePath", () => {
    it("returns the PATCH update path for reactivation", () => {
        const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
        assert.equal(getAffiliationReactivatePath(id), `/affiliations/${id}`);
    });

    it("uses isActive true payload for reactivation", () => {
        assert.deepEqual(AFFILIATION_REACTIVATE_PAYLOAD, { isActive: true });
    });
});
