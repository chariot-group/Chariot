import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NpcColumn2 from "@/components/character/tabContents/general/view/NpcColumn2";
import type { NPC } from "@/types/character";

const abilityScores = { strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 };

const createNpc = (stats?: Partial<NPC["stats"]>) =>
  ({
    stats: stats && {
      abilityScores,
      savingThrows: { strength: 0, dexterity: 2, constitution: 1, intelligence: -1, wisdom: 1, charisma: 0 },
      skills: {},
      ...stats,
    },
  }) as unknown as NPC;

const renderColumn = (npc: NPC) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{}}
      onError={() => {}}
      getMessageFallback={({ key }) => key}>
      <NpcColumn2
        npc={npc}
        accentColor="text-blue"
      />
    </NextIntlClientProvider>,
  );

/** Card that holds the given heading id, up to the next card. */
const cardOf = (html: string, headingId: string) => {
  const start = html.lastIndexOf('data-slot="card"', html.indexOf(`id="${headingId}"`));
  const next = html.indexOf('data-slot="card"', start + 1);
  return html.slice(start, next === -1 ? undefined : next);
};

/** @see FR-frontend-design — NPC saving throws and skills sit on a card surface like the PC sheet */
describe("NpcColumn2 — card surfaces", () => {
  it("nominal: saving throws list is rendered inside its card", () => {
    const card = cardOf(renderColumn(createNpc({})), "saving-throws-heading");

    expect(card).toContain('role="list"');
    expect(card.match(/role="listitem"/g)).toHaveLength(6);
  });

  it("nominal: skills list is rendered inside its card", () => {
    const card = cardOf(renderColumn(createNpc({})), "skills-heading");

    expect(card).toContain("skillNames.athletics");
    expect(card).toContain("skillNames.persuasion");
  });

  it("edge: an explicit skill bonus is shown inside the skills card", () => {
    const card = cardOf(renderColumn(createNpc({ skills: { stealth: 7 } } as Partial<NPC["stats"]>)), "skills-heading");

    expect(card).toContain("+7");
  });

  it("failure: no saving throw or skill row leaks outside the two cards", () => {
    const html = renderColumn(createNpc({}));
    const firstCard = html.indexOf('data-slot="card"');

    expect(html.match(/data-slot="card"/g)).toHaveLength(2);
    expect(html.slice(0, firstCard)).not.toContain('role="listitem"');
    expect(html.slice(0, firstCard)).not.toContain("skillNames.");
  });
});
