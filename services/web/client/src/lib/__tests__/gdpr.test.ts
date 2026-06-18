import {
  buildDataRequestMailto,
  buildDeleteAccountMailto,
  buildGdprExportFilename,
  buildProfileExportPayload,
  PRIVACY_CONTACT_EMAIL,
  sanitizeForGdprExport,
  serializeProfileExportPayload,
} from "@/lib/gdpr";
import type { User } from "@/types/user";
import { describe, expect, it } from "vitest";

const sampleUser: User = {
  keycloakId: "abc-123",
  email: "user@example.com",
  username: "adventurer",
  firstName: "Ada",
  lastName: "Lovelace",
  balance: 42,
  history: [],
};

describe("gdpr helpers", () => {
  it("builds profile export filename with ISO date", () => {
    expect(buildGdprExportFilename(new Date("2026-06-07T12:00:00.000Z"))).toBe(
      "chariot-profile-2026-06-07.json",
    );
  });

  it("builds profile-only export payload without internal identifiers", () => {
    const payload = buildProfileExportPayload(sampleUser, new Date("2026-06-07T12:00:00.000Z"));
    const json = serializeProfileExportPayload(payload);

    expect(json).not.toContain("keycloakId");
    expect(json).not.toContain("abc-123");
    expect(JSON.parse(json)).toEqual({
      exportedAt: "2026-06-07T12:00:00.000Z",
      profile: {
        email: "user@example.com",
        username: "adventurer",
        firstName: "Ada",
        lastName: "Lovelace",
        balance: 42,
        history: [],
      },
    });
  });

  it("sanitizes nested sensitive keys recursively", () => {
    const sanitized = sanitizeForGdprExport({
      keycloakId: "secret",
      nested: { createdBy: "secret", userId: "secret", label: "ok" },
    });

    expect(sanitized).toEqual({ nested: { label: "ok" } });
  });

  it("builds data request mailto for complete data access", () => {
    const mailto = buildDataRequestMailto(sampleUser, "fr");
    expect(mailto).toContain(`mailto:${PRIVACY_CONTACT_EMAIL}?`);
    expect(mailto).not.toContain("+");
    const decoded = decodeURIComponent(mailto);
    expect(decoded).toContain("complete copy of all my personal data");
    expect(decoded).toContain("Campaigns, groups, and characters");
    expect(decoded).toContain("user@example.com");
    expect(decoded).not.toContain("abc-123");
  });

  it("builds delete account mailto without internal identifiers", () => {
    const mailto = buildDeleteAccountMailto(sampleUser, "en");
    expect(mailto).not.toContain("+");
    const decoded = decodeURIComponent(mailto);
    expect(decoded).toContain("Account deletion request");
    expect(decoded).toContain("irreversible");
    expect(mailto).not.toContain("abc-123");
  });
});
