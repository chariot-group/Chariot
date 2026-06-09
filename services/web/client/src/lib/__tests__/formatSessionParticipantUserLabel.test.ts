import { describe, expect, it } from "vitest";
import {
    formatSessionParticipantFullName,
    formatSessionParticipantLabelFromWsUsername,
    formatSessionParticipantUserLabel,
    looksLikeKeycloakId,
    resolveSessionParticipantDisplayName,
    SESSION_PARTICIPANT_NAME_LOADING,
} from "@/lib/formatSessionParticipantUserLabel";

const KEYCLOAK_UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("formatSessionParticipantUserLabel", () => {
    it("nominal: returns username when present", () => {
        expect(
            formatSessionParticipantUserLabel({
                username: "aragorn",
                firstName: "Aragorn",
                lastName: "Elessar",
            }),
        ).toBe("aragorn");
    });

    it("edge: falls back to firstName + lastName when username is empty", () => {
        expect(
            formatSessionParticipantUserLabel({
                username: "",
                firstName: "Aragorn",
                lastName: "Elessar",
            }),
        ).toBe("Aragorn Elessar");
    });

    it("edge: ignores username that looks like a Keycloak id", () => {
        expect(
            formatSessionParticipantUserLabel({
                username: KEYCLOAK_UUID,
                firstName: "Legolas",
                lastName: "Greenleaf",
            }),
        ).toBe("Legolas Greenleaf");
    });

    it("error: returns null when no displayable label exists", () => {
        expect(
            formatSessionParticipantUserLabel({
                username: KEYCLOAK_UUID,
                firstName: "",
                lastName: "",
            }),
        ).toBeNull();
    });

    it("never exposes email in resolved display name", () => {
        expect(
            resolveSessionParticipantDisplayName({
                username: "",
                firstName: "",
                lastName: "",
            }),
        ).toBe(SESSION_PARTICIPANT_NAME_LOADING);
    });
});

describe("formatSessionParticipantLabelFromWsUsername", () => {
    it("nominal: returns trimmed websocket username", () => {
        expect(formatSessionParticipantLabelFromWsUsername("  gimli  ")).toBe("gimli");
    });

    it("edge: rejects Keycloak uuid from websocket payload", () => {
        expect(formatSessionParticipantLabelFromWsUsername(KEYCLOAK_UUID)).toBeNull();
    });
});

describe("looksLikeKeycloakId", () => {
    it("detects canonical uuid format", () => {
        expect(looksLikeKeycloakId(KEYCLOAK_UUID)).toBe(true);
        expect(looksLikeKeycloakId("not-a-uuid")).toBe(false);
    });
});

describe("formatSessionParticipantFullName", () => {
    it("joins first and last name with trimming", () => {
        expect(formatSessionParticipantFullName(" Frodo ", " Baggins ")).toBe("Frodo Baggins");
    });
});
