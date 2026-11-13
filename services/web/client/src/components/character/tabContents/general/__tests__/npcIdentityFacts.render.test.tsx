import { describe, expect, it } from "vitest";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import { IdentityFactCells } from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { npcIdentityFacts } from "@/components/character/tabContents/general/shared/npcIdentityFacts";
import type { NPC } from "@/types/character";

const labels = {
  type: "Type",
  challengeRating: "Facteur de puissance",
  alignment: "Alignement",
  alignmentName: (a: string) => `alignment:${a}`,
};
const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const factCells = (html: string) => html.match(/<div class="flex min-w-0 flex-col gap-0\.5 rounded-\[10px\]/g) ?? [];

const npc = (overrides: Partial<NPC>) =>
  ({ _id: "n1", firstname: "Grak", profile: { type: "Humanoïde", subtype: "Orc" }, ...overrides }) as unknown as NPC;

/** @see FR-character-identity-card (NPC facts), FR-npc-player-link (shared with Companions cards) */
describe("npcIdentityFacts", () => {
  it("nominal: type, alignment, challenge rating with XP in that order", () => {
    const facts = npcIdentityFacts(
      npc({
        challenge: { challengeRating: 0.25, experiencePoints: 50 },
        profile: { type: "Humanoïde", subtype: "Orc", alignment: "chaoticEvil" },
      } as unknown as Partial<NPC>),
      labels,
    );
    expect(facts.map((f) => f.key)).toEqual(["type", "alignment", "challengeRating"]);
    const text = textOf(render(<IdentityFactCells facts={facts} />));
    expect(text).toContain("Type Humanoïde Orc");
    expect(text).toContain("Facteur de puissance 1/4 50 XP");
    expect(text).toContain("Alignement alignment:chaoticEvil");
  });

  it("edge: CR 0 / missing challenge still renders the cell (0, 0 XP); no alignment → two cells", () => {
    const html = render(<IdentityFactCells facts={npcIdentityFacts(npc({}), labels)} />);
    expect(factCells(html)).toHaveLength(2);
    expect(textOf(html)).toContain("Facteur de puissance 0 0 XP");
  });

  it("failure / guard: non-finite XP falls back to 0 and an empty type is not rendered", () => {
    const facts = npcIdentityFacts(
      npc({ profile: {}, challenge: { challengeRating: 2, experiencePoints: Number.NaN } } as unknown as Partial<NPC>),
      labels,
    );
    const html = render(<IdentityFactCells facts={facts} />);
    expect(factCells(html)).toHaveLength(1);
    expect(textOf(html)).toBe("Facteur de puissance 2 0 XP");
  });
});
