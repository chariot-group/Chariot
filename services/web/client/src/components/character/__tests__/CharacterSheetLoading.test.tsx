import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const sessionState = { launched: true };
vi.mock("@/store/hooks", () => ({ useAppSelector: () => sessionState.launched }));

vi.mock("@/components/character/CombatBanner", () => ({
  CombatBanner: ({ characterId }: { characterId?: string }) => (
    <div
      data-slot="combat-footer-mock"
      data-character-id={characterId}
    />
  ),
}));

import { CharacterSheetLoading } from "@/components/character/skeleton/CharacterSheetLoading";
import { SkeletonFooterActions } from "@/components/character/skeleton/CharacterSheetSkeleton";
import { resolveCharacterSheetSkeletonVariant } from "@/components/character/skeleton/characterSheetSkeletonLayout";

const variant = resolveCharacterSheetSkeletonVariant("playerSpace", null);
const skeletonFooter = "border-t border-white/10";

beforeEach(() => {
  sessionState.launched = true;
});

describe("CharacterSheetLoading (FR-session-combat-navigation — footer kept while a sheet loads)", () => {
  it("nominal: in session, the real combat footer is shown instead of the skeleton footer", () => {
    const html = renderToStaticMarkup(
      <CharacterSheetLoading
        characterId="c-2"
        {...variant}
      />,
    );

    expect(html).toContain('data-slot="combat-footer-mock" data-character-id="c-2"');
    expect(html).not.toContain(skeletonFooter);
    expect(html).toContain('role="status"');
  });

  it("edge: the combat footer sits outside the busy status region", () => {
    const html = renderToStaticMarkup(
      <CharacterSheetLoading
        characterId="c-2"
        {...variant}
      />,
    );
    const status = html.indexOf('role="status"');
    expect(html.indexOf("combat-footer-mock")).toBeGreaterThan(status);
    expect(html.slice(status, html.indexOf("combat-footer-mock"))).toContain("</div></div>");
  });

  it("guard: out of session, the plain skeleton keeps its own footer and no combat footer", () => {
    sessionState.launched = false;
    const html = renderToStaticMarkup(
      <CharacterSheetLoading
        characterId="c-2"
        {...variant}
      />,
    );

    expect(html).toContain(skeletonFooter);
    expect(html).not.toContain("combat-footer-mock");
  });
});

describe("SkeletonFooterActions", () => {
  it("nominal: placeholder buttons share the width below 480px like the real ones", () => {
    const html = renderToStaticMarkup(<SkeletonFooterActions />);
    const bars = html.match(/class="[^"]*h-9 flex-1[^"]*"/g) ?? [];
    expect(bars).toHaveLength(2);
    for (const bar of bars) expect(bar).toContain("min-[480px]:flex-none");
  });
});

