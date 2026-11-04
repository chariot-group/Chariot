import { describe, expect, it } from "vitest";
import CharacterIdentityCard from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const factCells = (html: string) => html.match(/<div class="flex min-w-0 flex-col gap-0\.5 rounded-\[10px\]/g) ?? [];

const pcFacts = [
  { key: "race", label: "raceLabel", value: "Elfe", secondary: "Berserker" },
  { key: "level", label: "levelLabel", value: 3, secondary: "900 XP" },
];

/** @see FR-character-identity-card */
describe("CharacterIdentityCard", () => {
  it("nominal: PC renders name, nickname, two fact cells and one row per class with its subclass", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        lastname="Vent-Clair"
        surname="La Brise"
        facts={pcFacts}
        classes={[
          { name: "Magicien", level: 3, subclass: "Évocation" },
          { name: "Guerrier", level: 2, subclass: "Champion" },
        ]}
      />,
    );
    const text = textOf(html);

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="character-heading"');
    expect(text).toContain("firstname Aria lastname Vent-Clair");
    expect(text).toContain("« La Brise »");
    expect(factCells(html)).toHaveLength(2);
    expect(html).toContain('<dl class="grid gap-2 grid-cols-2">');
    expect(text).toContain("raceLabel Elfe Berserker");
    expect(text).toContain("levelLabel 3 900 XP");
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(text).toContain("Évocation");
    expect(html).toContain('aria-labelledby="character-classes-heading"');
  });

  it("nominal: facts and classes sit outside the avatar row (full card width)", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        avatar={<span data-avatar="" />}
        firstname="Aria"
        facts={pcFacts}
        classes={[{ name: "Magicien", level: 3 }]}
      />,
    );
    const avatarEnd = html.indexOf('<span data-avatar=""></span></div></div>');

    expect(avatarEnd).toBeGreaterThan(0);
    expect(html.indexOf('<dl class="grid gap-2')).toBeGreaterThan(avatarEnd);
    expect(html.indexOf("<ul")).toBeGreaterThan(avatarEnd);
  });

  it("nominal: name labels stay available to screen readers", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        lastname="Vent-Clair"
        surname="La Brise"
        facts={[]}
      />,
    );

    for (const label of ["firstname", "lastname", "surname"]) {
      expect(html).toContain(`<dt class="sr-only">${label}</dt>`);
    }
  });

  it("edge: NPC renders one full-width type cell, no secondary line when subtype is empty, no classes block", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Gobelin"
        facts={[{ key: "type", label: "typeLabel", value: "Humanoïde", secondary: "" }]}
      />,
    );

    expect(factCells(html)).toHaveLength(1);
    expect(html).toContain('<dl class="grid gap-2 grid-cols-1">');
    expect(html.match(/<dd/g)).toHaveLength(2);
    expect(html).not.toContain("«");
    expect(html).not.toContain(">lastname<");
    expect(html).not.toContain("character-classes-heading");
  });

  it("edge: a class without subclass renders no subclass line", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        facts={[]}
        classes={[{ name: "Magicien", level: 1 }]}
      />,
    );

    expect(html.match(/<li /g)).toHaveLength(1);
    expect(html).not.toContain("subclassOf");
  });

  it("failure: empty fact values and an empty class list render no cell and no classes block", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        facts={[{ key: "race", label: "raceLabel", value: "", secondary: "Berserker" }]}
        classes={[]}
      />,
    );

    expect(factCells(html)).toHaveLength(0);
    expect(html).not.toContain("grid gap-2");
    expect(html).not.toContain("<ul");
  });
});
