import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children?: ReactNode }) => (
    <a
      href={href}
      {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/media/MediaAvatar", () => ({
  MediaAvatar: ({ alt, className }: { alt: string; className?: string }) => (
    <span
      data-slot="avatar"
      data-alt={alt}
      className={className}
    />
  ),
}));

vi.mock("@/hooks/useMediaAvatar", () => ({ useMediaAvatarBatch: () => ({ getUrl: () => null }) }));

const state = {
  environment: { contextMode: "gm" as "gm" | "player" },
  session: {
    code: "ABCD",
    battleStarted: true,
    activeTurnRowId: "row-2" as string | null,
    currentRound: 4,
    turnsWithActions: [],
    initiativeTrackerRows: [] as InitiativeTrackerRow[],
  },
};

vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (s: unknown) => unknown) => selector(state),
}));

import {
  CombatBanner,
  getCenteredChipScrollLeft,
  resetCombatFooterStripMemory,
} from "@/components/character/CombatBanner";

const makeRow = (id: string, characterId: string, firstname: string, initiative: number): InitiativeTrackerRow => ({
  id,
  characterId,
  groupId: "__session_participants__",
  groupLabel: "Party",
  firstname,
  lastname: "",
  surname: "",
  initiative,
  initiativeModifier: 0,
  hitPoints: 10,
  maxHitPoints: 10,
  tempHitPoints: 0,
  armorClass: 14,
  visible: true,
  playerDisplayName: firstname,
  playerFieldVisibility: {
    initiative: true,
    name: true,
    hitPoints: true,
    lifeStatus: true,
    armorClass: true,
    conditions: true,
    concentration: true,
    groupLabel: true,
  },
  conditions: [],
  avatar: "",
  kind: "player",
  deathSavesFailures: 0,
});

const render = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);
const editActions = <button type="button">Edit character</button>;

beforeEach(() => {
  state.environment.contextMode = "gm";
  state.session.battleStarted = true;
  state.session.activeTurnRowId = "row-2";
  state.session.initiativeTrackerRows = [makeRow("row-1", "c-1", "Aria", 18), makeRow("row-2", "c-2", "Bram", 12)];
});

describe("CombatBanner — sheet combat footer (FR-session-combat-navigation)", () => {
  it("nominal: GM footer shows the combatant strip and edit actions, without turn controls or round", () => {
    const html = render(
      <CombatBanner
        characterId="c-1"
        footerActions={editActions}
      />,
    );

    expect(html).toContain('data-slot="combat-footer-strip"');
    expect(html).toContain('aria-label="rowsRegion"');
    expect(html).toContain("Edit character");
    expect(html).not.toContain("previousTurn");
    expect(html).not.toContain("nextTurn");
    expect(html).not.toContain("roundIndicator");
    // Strip in initiative order; the active combatant is marked for assistive tech.
    expect(html.indexOf('data-alt="Aria"')).toBeLessThan(html.indexOf('data-alt="Bram"'));
    // Active turn: sky-blue ring on the bubble; the sheet on screen (Aria) is the selected chip with the box.
    expect(html).toMatch(/data-active="true"[^>]*>[^]*?data-alt="Bram" class="ring-2 ring-blue"/);
    expect(html).toMatch(/<a[^>]*href="\/characters\/c-1[^"]*"[^>]*aria-current="page"[^>]*class="[^"]*bg-gray /);
    // The highlight is enough: no "turn of X" text.
    expect(html).not.toContain("notYourTurn");
    expect(html).not.toContain('data-slot="combat-footer-turn"');
  });

  it("edge: chip names are cut after 10 characters, full name kept as tooltip", () => {
    state.session.initiativeTrackerRows = [makeRow("row-1", "c-1", "Bartholomew", 18), makeRow("row-2", "c-2", "Bram", 12)];
    const html = render(<CombatBanner characterId="c-1" />);

    expect(html).toContain(">Bartholome…<");
    expect(html).toContain('title="Bartholomew"');
    expect(html).toContain(">Bram<");
  });

  it("nominal: on mobile the edit actions sit under the strip, full width (each button sizes itself) and right-aligned", () => {
    const html = render(
      <CombatBanner
        characterId="c-1"
        footerActions={editActions}
      />,
    );

    const strip = html.indexOf('data-slot="combat-footer-strip"');
    const mobileActions = html.indexOf('data-slot="combat-footer-mobile-actions"');
    expect(mobileActions).toBeGreaterThan(strip);
    const tag = html.slice(mobileActions, html.indexOf(">", mobileActions));
    expect(tag).toContain("[&amp;&gt;div]:w-full");
    expect(tag).toContain("justify-end");
    expect(tag).toContain("sm:hidden");
  });

  it("nominal: a GM chip is a direct link to the combatant's session sheet, with no stats panel", () => {
    const html = render(<CombatBanner characterId="c-1" />);

    expect(html).toContain('href="/characters/c-2?sessionCode=ABCD"');
    expect(html).toContain('href="/characters/c-1?sessionCode=ABCD"');
    expect(html).toContain("viewSheetFor:{&quot;name&quot;:&quot;Bram&quot;}");
    expect(html).not.toContain("aria-expanded");
    expect(html).not.toContain("combat-footer-stats");
  });

  it("edge: on the player's turn the status reads « your turn » in primary-light; no turn controls either", () => {
    state.environment.contextMode = "player";
    state.session.activeTurnRowId = "row-1";
    const html = render(<CombatBanner characterId="c-1" />);

    expect(html).toContain("yourTurn");
    expect(html).toMatch(/data-slot="combat-footer-turn" class="[^"]*text-primary-light/);
    expect(html).not.toContain("previousTurn");
    expect(html).not.toContain("roundIndicator");
    // Own character chip keeps its accessible label and is the only link (other sheets are not readable).
    expect(html).toContain("ownCharacterLabel:{&quot;name&quot;:&quot;Aria&quot;}");
    expect(html).toContain('href="/characters/c-1?sessionCode=ABCD"');
    expect(html).not.toContain('href="/characters/c-2');
  });

  it("guard: before combat start only the edit actions are shown, on the sheet footer frame", () => {
    state.session.battleStarted = false;
    const html = render(
      <CombatBanner
        characterId="c-1"
        footerActions={editActions}
      />,
    );

    expect(html).toContain("Edit character");
    expect(html).not.toContain("combat-footer-strip");
    expect(html).toContain("border-t border-frame");
    expect(html).toContain("px-4 sm:px-6 md:px-8");
  });

  it("guard: no ad-hoc white opacity text in the footer (design tokens only)", () => {
    const html = render(
      <CombatBanner
        characterId="c-1"
        footerActions={editActions}
      />,
    );

    expect(html).not.toMatch(/text-white\/\d+/);
    expect(html).not.toContain("opacity-40");
  });
});

describe("CombatBanner strip scroll (no movement on sheet selection)", () => {
  it("nominal: centers the active chip in the strip", () => {
    expect(getCenteredChipScrollLeft({ offsetLeft: 400, offsetWidth: 100 }, 300)).toBe(300);
  });

  it("edge: a chip near the start clamps to 0", () => {
    expect(getCenteredChipScrollLeft({ offsetLeft: 20, offsetWidth: 100 }, 300)).toBe(0);
  });

  it("guard: the strip memory can be reset and rendering after a reset still works", () => {
    resetCombatFooterStripMemory();
    expect(render(<CombatBanner characterId="c-1" />)).toContain('data-slot="combat-footer-strip"');
  });
});

