import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), "src/components/dialogs", file), "utf8");

const toastDialogs = [
  ["CreateCampaignDialog.tsx", "campaignCreatedSuccess"],
  ["EditCampaignDialog.tsx", "campaignUpdatedSuccess"],
  ["CreateGroupDialog.tsx", "groupCreatedSuccess"],
  ["EditGroupDialog.tsx", "groupUpdatedSuccess"],
] as const;

/** @see docs/design.md §6.4 — long campaign / group names */
describe("Success toasts — long campaign and group names", () => {
  it.each(toastDialogs)("nominal: %s truncates the name embedded in %s", (file, key) => {
    const source = read(file);
    const call = source.match(new RegExp(`t\\(\\s*"${key}",\\s*\\{\\s*name:\\s*([^}]+)\\}`))?.[1] ?? "";

    expect(call).toContain("truncateForSidebarMenuLabel(");
    expect(call).toContain("TOAST_EMBEDDED_NAME_MAX_LENGTH");
  });
});

/** @see FR-session-lobby-modal — lobby heading (design.md §6.4) */
describe("Session lobby heading — long campaign names", () => {
  const lobby = read("SessionLobbyContent.tsx");
  const heading =
    lobby.match(/<TruncatedText\s+as="h2"\s+id="session-lobby-players-heading"[\s\S]*?<\/TruncatedText>/)?.[0] ?? "";

  it("nominal: heading stays on one line (TruncatedText) with the full title in its tooltip", () => {
    expect(heading).not.toContain("lines={2}");
    expect(heading).toMatch(/className="[^"]*\bflex-1\b/);
    expect(heading).toContain('text={lobbyCampaignName ? `${t("title")} - ${lobbyCampaignName}` : t("title")}');
    expect(heading).not.toMatch(/\btitle=\{/);
  });

  it("edge: separator is always rendered before the campaign name", () => {
    expect(heading).toContain(" - {lobbyCampaignName}");
    expect(heading).not.toContain("campaign?.label ??");
  });

  it("failure guard: no dangling separator when no campaign name is known", () => {
    expect(heading).toMatch(/\{lobbyCampaignName && \(?\s*<span/);
    expect(lobby).toContain("const lobbyCampaignName = campaign?.label || campaignLabel || undefined;");
  });
});
