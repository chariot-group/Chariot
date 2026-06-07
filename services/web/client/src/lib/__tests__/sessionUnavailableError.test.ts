import { describe, expect, it } from "vitest";
import { isSessionUnavailableMessage, parseSessionUnavailableReason } from "@/lib/sessionUnavailableError";

describe("sessionUnavailableError", () => {
    it("returns closed for a closed session message", () => {
        expect(parseSessionUnavailableReason("Session with code ABC123 is closed")).toBe("closed");
        expect(isSessionUnavailableMessage("Session with code ABC123 is closed")).toBe(true);
    });

    it("returns expired for an expired session message", () => {
        expect(parseSessionUnavailableReason("Session with code ABC123 is expired since 2026-01-01")).toBe("expired");
    });

    it("returns notFound for missing or deleted sessions", () => {
        expect(parseSessionUnavailableReason("Session with code ABC123 not found")).toBe("notFound");
        expect(parseSessionUnavailableReason("Session with code ABC123 is deleted")).toBe("notFound");
    });

    it("returns null for unrelated errors", () => {
        expect(parseSessionUnavailableReason("Token limit reached")).toBeNull();
        expect(isSessionUnavailableMessage(undefined)).toBe(false);
    });
});
