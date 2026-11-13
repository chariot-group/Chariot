import { describe, expect, it } from "vitest";
import CharacterIdentityCard, {
  FACTS_DENSE_TWO_COLUMNS_CLASS,
} from "@/components/character/tabContents/general/shared/CharacterIdentityCard";
import { render } from "@/components/character/tabContents/__tests__/bentoRender";
import { FACT_CELL_CLASS } from "@/components/character/tabContents/shared/factCell";

/** React escapes `&` and `>` inside attribute values. */
const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/>/g, "&gt;");
const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const factCells = (html: string) => html.split(`<div class="${FACT_CELL_CLASS}"`).slice(1);

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
    expect(html).toContain('<ul class="flex flex-col gap-2"');
    expect(html).not.toContain("border-l");
    expect(html).not.toMatch(/(?<![:\w-])bg-gray-middle-light\/\d+/);
    expect(html).toContain(
      `<dl class="grid gap-y-2 gap-x-2 sm:gap-x-3 ${escapeAttr(FACTS_DENSE_TWO_COLUMNS_CLASS)}">`,
    );
    expect(text).toContain("raceLabel Elfe Berserker");
    expect(text).toContain("levelLabel 3 900 XP");
    expect(html).toContain("@md:inline");
    expect(html).toContain(">Berserker</span></dd>");
    expect(html).toContain(">900 XP</span></dd>");
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(text).toContain("Évocation");
    expect(html).toContain('aria-labelledby="character-classes-heading"');
  });

  it("edge: three facts (one empty) render three cells, the odd last one spanning the row (no empty 4th slot)", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        facts={[
          ...pcFacts,
          { key: "alignment", label: "alignment", value: "Loyal Bon" },
          { key: "background", label: "background", value: "" },
        ]}
      />,
    );

    expect(factCells(html)).toHaveLength(3);
    expect(html).toContain(
      `<dl class="grid gap-y-2 gap-x-2 sm:gap-x-3 ${escapeAttr(FACTS_DENSE_TWO_COLUMNS_CLASS)}">`,
    );
    expect(html).not.toContain(">background<");
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
    expect(html.indexOf('<dl class="grid gap-y-2')).toBeGreaterThan(avatarEnd);
    expect(html.indexOf("<ul")).toBeGreaterThan(avatarEnd);
  });

  it("edge: long name and nickname are clamped to two lines on every screen, without native title", () => {
    const longLast = "de la Tour-Sombre-des-Brumes-Éternelles";
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Aria"
        lastname={longLast}
        surname="La Brise du Nord Lointain"
        facts={[]}
      />,
    );

    expect(html).toMatch(/<dl[^>]*class="[^"]*line-clamp-2 break-words[^"]*text-lg font-bold sm:text-xl"/);
    expect(html).toMatch(
      /<dd[^>]*class="[^"]*line-clamp-2 break-words[^"]*italic[^"]*"[^>]*>« La Brise du Nord Lointain »<\/dd>/,
    );
    expect(html.match(/line-clamp-2/g)).toHaveLength(2);
    // Same clamp everywhere: no hover- or pointer-only variant, no native title
    expect(html).not.toMatch(/\[@media\(hover:hover\)\]|pointer-coarse:/);
    expect(html).not.toContain("title=");
    // Full text stays in the DOM for screen readers
    expect(textOf(html)).toContain(`Aria lastname ${longLast}`);
  });

  it("failure: a name that is not measured as cut shows no help cursor (tooltip cannot open)", () => {
    const html = render(
      <CharacterIdentityCard
        accentColor="text-blue"
        firstname="Gobelin"
        facts={[]}
      />,
    );

    expect(html).not.toContain("cursor-help");
    expect(html).not.toContain("«");
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
    expect(html).toContain('<dl class="grid gap-y-2 gap-x-2 sm:gap-x-3 grid-cols-1">');
    expect(html.match(/<dd/g)).toHaveLength(2);
    expect(html).toMatch(/<dd class="[^"]*font-bold[^"]*"><span[^>]*>Humanoïde<\/span><\/dd>/);
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
