import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MonsterCodexDialog from "@/components/character/MonsterCodexDialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/services/CodexService", () => ({
  default: {
    searchMonsters: vi.fn(),
    searchPlayers: vi.fn(),
  },
}));

const renderEmbedded = (open = true) =>
  renderToStaticMarkup(
    <MonsterCodexDialog
      open={open}
      onOpenChange={() => undefined}
      browseOnly
      embedded
      lockedEntityTypeFilter="players"
    />,
  );

describe("MonsterCodexDialog layout", () => {
  it("nominal: Chariot / SRD legend is rendered above the search input", () => {
    const html = renderEmbedded();
    const legendIndex = html.indexOf('aria-label="legendLabel"');
    const searchIndex = html.indexOf('placeholder="searchPlaceholder"');

    expect(legendIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(-1);
    expect(legendIndex).toBeLessThan(searchIndex);
  });

  it("edge: body has no outer padding so the sidebar right border spans full height", () => {
    const html = renderEmbedded();
    const body = html.match(/<div class="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">/)?.[0];
    const sidebar = html.match(/<div class="[^"]*lg:w-1\/4[^"]*">/)?.[0] ?? "";

    expect(body).toBeTruthy();
    expect(sidebar).toContain("lg:border-r lg:border-frame");
    expect(sidebar).toContain("p-4");
  });

  it("edge: result list scrolls without a visible scrollbar", () => {
    const html = renderEmbedded();
    const list = html.match(/<div class="[^"]*flex-1 overflow-y-auto[^"]*">/)?.[0] ?? "";

    expect(list).toContain("scrollbar-none");
    expect(list).not.toContain("webkit-scrollbar");
  });

  it("failure guard: embedded closed dialog renders nothing", () => {
    expect(renderEmbedded(false)).toBe("");
  });
});
