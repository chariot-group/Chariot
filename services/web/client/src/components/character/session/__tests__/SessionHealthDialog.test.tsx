import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    <span
      data-slot="image"
      data-alt={alt}
    />
  ),
}));

vi.mock("@public/assets/icons/red-circle.svg", () => ({ default: "red-circle.svg" }));
vi.mock("@public/assets/icons/white-circle.svg", () => ({ default: "white-circle.svg" }));

vi.mock("@/services/CharacterService", () => ({ default: { updateCharacter: vi.fn() } }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

// Render dialog parts inline (no portal) so the static markup can be inspected.
vi.mock("@/components/ui/dialog", () => {
  const passthrough = (slot: string) => {
    function DialogPart({ children, className }: { children?: ReactNode; className?: string }) {
      return (
        <div
          data-slot={slot}
          className={className}>
          {children}
        </div>
      );
    }
    return DialogPart;
  };
  return {
    Dialog: ({ children }: { children?: ReactNode }) => <>{children}</>,
    DialogContent: passthrough("dialog-content"),
    DialogHeader: passthrough("dialog-header"),
    DialogTitle: passthrough("dialog-title"),
  };
});

import { nextDeathSaveCount, SessionHealthDialog } from "@/components/character/session/SessionHealthDialog";
import type { NPC, Player } from "@/types/character";

const stats = { currentHitPoints: 0, maxHitPoints: 20, tempHitPoints: 0 };

// Only the fields the dialog reads (`progression` marks a player for `isPlayer`).
const player = {
  _id: "player-1",
  progression: {},
  stats,
  deathSaves: { successes: 1, failures: 2 },
} as unknown as Player;

const npc = { _id: "npc-1", stats } as unknown as NPC;

const render = (character: Player | NPC, showDeathSaves = true, pending = false) =>
  renderToStaticMarkup(
    <SessionHealthDialog
      open
      onOpenChange={() => {}}
      character={character}
      characterType={character === npc ? "npcs" : "players"}
      sessionCode="ABCD"
      onCharacterUpdate={() => {}}
      showDeathSaves={showDeathSaves}
      pending={pending}
    />,
  );

const pressedSlots = (html: string, labelKey: string) =>
  (html.match(new RegExp(`<button[^>]*aria-label="${labelKey}[^"]*"[^>]*>`, "g")) ?? []).map((tag) =>
    tag.includes('aria-pressed="true"'),
  );

describe("SessionHealthDialog — death saves (FR-combat-initiative-tracker HP session interaction)", () => {
  it("nominal: a player row shows 3 success and 3 failure slots reflecting the character", () => {
    const html = render(player);

    expect(html).toContain('id="session-hp-death-saves-heading"');
    expect(pressedSlots(html, "deathSaveSuccessButton")).toEqual([true, false, false]);
    expect(pressedSlots(html, "deathSaveFailureButton")).toEqual([true, true, false]);
    expect(html).toContain('aria-label="resetDeathSaves"');
  });

  it("edge: an NPC, or a dialog opened without the tracker flag, has no death saves section", () => {
    expect(render(npc)).not.toContain("session-hp-death-saves-heading");
    expect(render(player, false)).not.toContain("session-hp-death-saves-heading");
  });

  it("edge: a player above 0 HP has no death saves section, at 0 HP or below it does", () => {
    const withHp = (currentHitPoints: number) =>
      ({ ...player, stats: { ...stats, currentHitPoints } }) as unknown as Player;

    expect(render(withHp(1))).not.toContain("session-hp-death-saves-heading");
    expect(render(withHp(0))).toContain("session-hp-death-saves-heading");
    expect(render(withHp(-3))).toContain("session-hp-death-saves-heading");
  });

  it("guard: sections are separated by spacing only, without bordered boxes", () => {
    const html = render(player);

    expect(html).not.toContain("rounded-[15px] border");
    expect(html).toContain("border-b border-frame");
    // Current HP, temporary HP and death saves.
    expect((html.match(/<section class="grid gap-3"/g) ?? []).length).toBe(3);
  });
});

describe("SessionHealthDialog — pending (sheet still loading)", () => {
  it("nominal: the dialog is shown at once with the known values, every control disabled, no loader", () => {
    const html = render(player, true, true);

    expect(html).toContain("0/20");
    expect(html).toContain('id="session-hp-death-saves-heading"');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("animate-spin");
    const slots = html.match(/<button[^>]*aria-label="deathSave(Success|Failure)Button[^"]*"[^>]*>/g) ?? [];
    expect(slots).toHaveLength(6);
    for (const tag of slots) expect(tag).toContain('disabled=""');
    expect(html).toMatch(/<input[^>]*disabled=""/);
  });

  it("guard: once loaded, the death save slots are enabled again", () => {
    const html = render(player, true, false);
    const slots = html.match(/<button[^>]*aria-label="deathSave(Success|Failure)Button[^"]*"[^>]*>/g) ?? [];
    for (const tag of slots) expect(tag).not.toContain('disabled=""');
  });
});

describe("nextDeathSaveCount", () => {
  it("nominal: clicking an empty slot fills up to it", () => {
    expect(nextDeathSaveCount(0, 2)).toBe(3);
    expect(nextDeathSaveCount(1, 1)).toBe(2);
  });

  it("edge: clicking the last filled slot clears it", () => {
    expect(nextDeathSaveCount(3, 2)).toBe(2);
    expect(nextDeathSaveCount(1, 0)).toBe(0);
  });

  it("edge: clicking an earlier filled slot lowers the count to it", () => {
    expect(nextDeathSaveCount(3, 0)).toBe(1);
  });
});
