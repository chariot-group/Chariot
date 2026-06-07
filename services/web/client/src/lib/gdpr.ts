import type { User } from "@/types/user";

export const PRIVACY_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "contact@chariot.tools";

export const PRIVACY_POLICY_URL = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL;

/** Internal auth identifiers that must never appear in user-facing exports. */
const SENSITIVE_EXPORT_KEYS = new Set(["keycloakId", "createdBy", "userId"]);

export type GdprMailtoAction = "dataRequest" | "deleteAccount";

export interface GdprProfileExportPayload {
  exportedAt: string;
  profile: Omit<User, "keycloakId">;
}

interface MailtoContent {
  subject: string;
  body: string;
}

export function sanitizeForGdprExport<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForGdprExport(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_EXPORT_KEYS.has(key)) {
        continue;
      }
      result[key] = sanitizeForGdprExport(val);
    }
    return result as T;
  }

  return value;
}

export function buildProfileExportPayload(
  user: User,
  exportedAt: Date = new Date(),
): GdprProfileExportPayload {
  const { keycloakId: _keycloakId, ...profile } = user;

  return sanitizeForGdprExport({
    exportedAt: exportedAt.toISOString(),
    profile,
  });
}

export function buildGdprExportFilename(date: Date = new Date()): string {
  return `chariot-profile-${date.toISOString().slice(0, 10)}.json`;
}

export function serializeProfileExportPayload(payload: GdprProfileExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function buildGdprMailto(
  _action: GdprMailtoAction,
  content: MailtoContent,
): string {
  const query = [
    `subject=${encodeURIComponent(content.subject)}`,
    `body=${encodeURIComponent(content.body)}`,
  ].join("&");

  return `mailto:${PRIVACY_CONTACT_EMAIL}?${query}`;
}

export function buildDataRequestMailto(user: User, locale: string): string {
  return buildGdprMailto("dataRequest", {
    subject: `[Chariot] Data access request — ${user.email}`,
    body: [
      "Hello,",
      "",
      "I would like to exercise my right of access under GDPR and receive a complete copy of all my personal data held by Chariot.",
      "",
      `Account email: ${user.email}`,
      `Username: ${user.username}`,
      `Preferred language: ${locale}`,
      "",
      "Please include all data linked to my account, including:",
      "- Profile and account information",
      "- Campaigns, groups, and characters",
      "- Game sessions and participation history",
      "- Token purchases, payments, and transaction history",
      "- Referral and affiliation data",
      "- Any other personal data you process about me",
      "",
      "Thank you.",
    ].join("\n"),
  });
}

export function buildDeleteAccountMailto(user: User, locale: string): string {
  return buildGdprMailto("deleteAccount", {
    subject: `[Chariot] Account deletion request — ${user.email}`,
    body: [
      "Hello,",
      "",
      "I confirm that I wish to permanently delete my Chariot account and all associated personal data.",
      "",
      `Account email: ${user.email}`,
      `Username: ${user.username}`,
      `Preferred language: ${locale}`,
      "",
      "I understand this action is irreversible.",
      "",
      "Thank you.",
    ].join("\n"),
  });
}
