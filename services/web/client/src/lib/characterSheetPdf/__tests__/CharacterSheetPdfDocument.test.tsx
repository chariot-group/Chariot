/** @see FR-character-sheet-pdf-export */

import fs from "node:fs";
import path from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { Image, Link, renderToBuffer } from "@react-pdf/renderer";
import {
  AttackRow,
  CharacterSheetPdfDocument,
  EmptyDots,
  HitDicePill,
  PDF_FOOTER_SITE_LABEL,
  PDF_FOOTER_SITE_URL,
  WriteInField,
} from "@/lib/characterSheetPdf/CharacterSheetPdfDocument";
import { CHARACTER_SHEET_PDF_THEMES } from "@/lib/characterSheetPdf/themes";
import { buildCharacterSheetPdfLabels } from "@/lib/characterSheetPdf/buildCharacterSheetPdfLabels";
import type { CharacterSheetPdfTheme } from "@/lib/characterSheetPdf/themes";
import type { CharacterSheetPdfData, PdfSpellRow } from "@/lib/characterSheetPdf/types";

const messages = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "messages/fr.json"), "utf8"));
const makeT = (ns: string) => (key: string, values?: Record<string, string | number>) => {
  let node: unknown = messages;
  for (const part of `${ns}.${key}`.split(".")) node = (node as Record<string, unknown>)?.[part];
  let text = typeof node === "string" ? node : key;
  for (const [k, v] of Object.entries(values ?? {})) text = text.replace(`{${k}}`, String(v));
  return text;
};
const labels = buildCharacterSheetPdfLabels({
  tPdf: makeT("characterDetail.pdfExport"),
  tGeneral: makeT("characterDetail.player.general"),
  tBattle: makeT("characterDetail.battle"),
  tEdit: makeT("characterDetail.edit"),
  tNpc: makeT("characterDetail.npc"),
  tClass: makeT("classes"),
  tAlignment: makeT("alignments"),
  tCommon: makeT("common"),
  tMagic: makeT("characterDetail.magic"),
});

const lorem =
  "Une traînée lumineuse jaillit de votre doigt pointé vers un point de votre choix situé à portée, puis éclate dans un rugissement sourd pour se transformer en explosion de flammes. Chaque créature située dans une sphère de 6 mètres de rayon centrée sur ce point doit effectuer un jet de sauvegarde de Dextérité. ";
const spell = (name: string, level: number, descRepeat: number, prepared = true): PdfSpellRow => ({
  name,
  level,
  prepared,
  school: "Évocation",
  description: lorem.repeat(descRepeat),
  components: "V, S, M (une petite boule de guano de chauve-souris et du soufre)",
  castingTime: "1 action",
  duration: "Instantanée",
  range: "45 mètres",
  damage: level > 0 ? "8d6 feu" : "1d10 feu",
  healing: null,
  effectType: "attack",
  usesPerDay: null,
  used: null,
});

const data: CharacterSheetPdfData = {
  isPlayer: true,
  displayName: "Elowen Brisevent",
  playerName: "Alex",
  raceOrType: "Elfe",
  race: "Elfe",
  subrace: "Haut-elfe",
  classOrCr: "Magicien 7",
  classPrimary: "Magicien 7",
  subclassPrimary: "École d'évocation",
  classEntries: [{ name: "Magicien", subclass: "École d'évocation", level: 7, label: "Magicien 7" }],
  hitDiceEntries: [{ notation: "7d6", className: "Magicien" }],
  backgroundOrSubtype: "Sage",
  alignment: "Chaotique bon",
  experience: "23000",
  proficiencyBonus: "+3",
  abilities: [
    ["FOR", "Force", 8, "-1"],
    ["DEX", "Dextérité", 14, "+2"],
    ["CON", "Constitution", 13, "+1"],
    ["INT", "Intelligence", 18, "+4"],
    ["SAG", "Sagesse", 12, "+1"],
    ["CHA", "Charisme", 10, "+0"],
  ].map(([abbr, name, score, modifier]) => ({
    abbr: String(abbr),
    name: String(name),
    score: Number(score),
    modifier: String(modifier),
  })),
  savingThrows: ["FOR", "DEX", "CON", "INT", "SAG", "CHA"].map((abbr, i) => ({
    abbr,
    bonus: `+${i}`,
    proficient: i === 3,
    masteryLevel: i === 3 ? 1 : 0,
  })),
  skills: Object.entries(labels.skillNames).map(([key, name], i) => ({
    key,
    name,
    abilityName: "Intelligence",
    abilityAbbr: "INT",
    bonus: `+${i % 6}`,
    proficient: i % 4 === 0,
    masteryLevel: i % 4 === 0 ? 1 : 0,
  })),
  passivePerception: "11",
  armorClass: "15",
  initiative: "+2",
  speed: "9 m",
  maxHp: "45",
  hitDice: "7d6",
  attacks: [
    { name: "Dague", bonus: "+5", damage: "1d4+2", damageType: "perforant", range: "6 m" },
    { name: "Trait de feu", bonus: "+7", damage: "2d10", damageType: "feu", range: "36 m" },
  ],
  equipment: "Bâton de sorcier, grimoire, sacoche à composantes, robe de voyage, 10 bougies.",
  treasureText: "Une gemme bleue.",
  currencies: { cp: 12, sp: 30, ep: 0, gp: 152, pp: 2 },
  proficiencies: "",
  languages: "Commun, elfique, draconique",
  senses: "Vision dans le noir 18 m",
  tools: "Matériel de calligraphe",
  weapons: "Dagues, fléchettes, frondes, bâtons, arbalètes légères",
  armors: "Aucune",
  features: [
    {
      name: "Restauration arcanique",
      description: "Une fois par jour, après un repos court, récupère des emplacements de sorts.",
    },
    { name: "Sculpter les sorts", description: "Protège des alliés des effets de vos sorts d'évocation." },
  ],
  appearance: {
    age: "112",
    height: "1,75 m",
    weight: "60 kg",
    eyes: "Verts",
    skin: "Pâle",
    hair: "Argent",
    description: "Silhouette élancée, toujours couverte d'encre.",
  },
  personalityTraits: "Curieuse et distraite.",
  ideals: "Le savoir avant tout.",
  bonds: "Mon grimoire est ma vie.",
  flaws: "Je néglige le danger.",
  alliesAndOrgs: "La Tour d'Argent.",
  backstory: "Née dans une famille de scribes, elle a quitté sa cité pour retrouver un grimoire perdu.",
  spellcastingBlocks: [
    {
      className: "Magicien",
      ability: "Intelligence",
      saveDc: "15",
      attackBonus: "+7",
      cantrips: [spell("Trait de feu", 0, 1), spell("Main de mage", 0, 1), spell("Prestidigitation", 0, 2)],
      spellsByLevel: {
        1: [spell("Projectile magique", 1, 1), spell("Bouclier", 1, 1), spell("Détection de la magie", 1, 3, false)],
        2: [spell("Pas brumeux", 2, 1), spell("Toile d'araignée", 2, 2)],
        3: [spell("Boule de feu", 3, 12), spell("Contresort", 3, 2)],
        4: [spell("Porte dimensionnelle", 4, 1)],
      },
      slotsByLevel: {
        1: { used: 1, total: 4 },
        2: { used: 0, total: 3 },
        3: { used: 2, total: 3 },
        4: { used: 0, total: 1 },
      },
      isInnate: false,
    },
  ],
  hasSpellcasting: true,
  avatarDataUrl: null,
  qrCodeDataUrl: null,
  characterPageUrl: "https://chariot.tools/fr/characters/x",
};

async function renderPages(input: CharacterSheetPdfData, theme: CharacterSheetPdfTheme) {
  const buffer = await renderToBuffer(
    React.createElement(CharacterSheetPdfDocument, { data: input, labels, theme }) as Parameters<
      typeof renderToBuffer
    >[0],
  );
  const raw = buffer.toString("latin1");
  return {
    count: raw.match(/\/Type \/Page\b/g)?.length ?? 0,
    mediaBoxes: raw.match(/\/MediaBox \[[^\]]*\]/g) ?? [],
  };
}

const LETTER_MEDIA_BOX = "/MediaBox [0 0 612 792]";
/** 1×1 transparent PNG, enough to exercise the avatar and QR code image slots. */
const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const denseData: CharacterSheetPdfData = {
  ...data,
  spellcastingBlocks: [
    {
      ...data.spellcastingBlocks[0]!,
      cantrips: Array.from({ length: 12 }, (_, i) => spell(`Sort mineur au nom assez long ${i}`, 0, 1)),
      spellsByLevel: Object.fromEntries(
        Array.from({ length: 9 }, (_, level) => [
          level + 1,
          Array.from({ length: 11 }, (_, i) => spell(`Sort ${level + 1}-${i}`, level + 1, 1, i % 2 === 0)),
        ]),
      ),
      slotsByLevel: Object.fromEntries(Array.from({ length: 9 }, (_, level) => [level + 1, { used: 0, total: 4 }])),
    },
  ],
};

describe("FR-character-sheet-pdf-export — CharacterSheetPdfDocument rendering", () => {
  for (const theme of ["dark", "light"] as const) {
    it(`nominal (${theme}): core, biography, spell overview and two spell detail pages, all LETTER`, async () => {
      const { count, mediaBoxes } = await renderPages(data, theme);
      // 11 spells, one capped at half a page: two detail pages, no description continuation page.
      expect(count).toBe(6);
      expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
    }, 30000);
  }

  it("edge: without spellcasting only the core and biography pages remain", async () => {
    const { count } = await renderPages({ ...data, hasSpellcasting: false, spellcastingBlocks: [] }, "dark");
    expect(count).toBe(2);
  }, 30000);

  it("edge: the densest caster keeps the spell overview on a single LETTER page", async () => {
    const { mediaBoxes } = await renderPages(denseData, "dark");
    expect(mediaBoxes.length).toBeGreaterThan(3);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("edge: avatar and QR code in the header keep the nominal page count", async () => {
    const { count, mediaBoxes } = await renderPages(
      { ...data, avatarDataUrl: TINY_PNG_DATA_URL, qrCodeDataUrl: TINY_PNG_DATA_URL },
      "dark",
    );
    expect(count).toBe(6);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("edge: four classes grow the header without adding a page", async () => {
    const classEntries = ["Magicien", "Guerrier", "Clerc", "Roublard"].map((name, index) => ({
      name,
      subclass: index % 2 === 0 ? "Sous-classe" : "",
      level: index + 1,
      label: `${name} ${index + 1}`,
    }));
    const { count, mediaBoxes } = await renderPages({ ...data, classEntries }, "dark");
    expect(count).toBe(6);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("edge: long texts and many features overflow onto extra LETTER pages instead of breaking the layout", async () => {
    const longText = (sentence: string, times: number) => Array.from({ length: times }, () => sentence).join(" ");
    const { count, mediaBoxes } = await renderPages(
      {
        ...data,
        equipment: longText("Corde de chanvre de 15 mètres, sac de couchage, outre d'eau, rations.", 40),
        backstory: longText("Elle a quitté sa cité natale pour retrouver un grimoire perdu.", 120),
        alliesAndOrgs: longText("La Tour d'Argent et ses archivistes.", 30),
        languages: longText("Commun, elfique, draconique", 10),
        features: Array.from({ length: 24 }, (_, index) => ({
          name: `Capacité ${index + 1}`,
          description: longText("Une fois par repos court, récupère un emplacement de sort.", (index % 3) + 1),
        })),
      },
      "light",
    );
    expect(count).toBeGreaterThan(6);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("edge: an empty sheet renders blank fields on the core and biography pages", async () => {
    const empty: CharacterSheetPdfData = {
      ...data,
      displayName: "",
      race: "",
      subrace: "",
      classPrimary: "",
      subclassPrimary: "",
      classEntries: [],
      backgroundOrSubtype: "",
      alignment: "",
      experience: "",
      attacks: [],
      equipment: "",
      treasureText: "",
      features: [],
      personalityTraits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      alliesAndOrgs: "",
      backstory: "",
      hasSpellcasting: false,
      spellcastingBlocks: [],
    };
    const { count, mediaBoxes } = await renderPages(empty, "dark");
    expect(count).toBe(2);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("edge: an NPC with innate spellcasting renders its overview on one LETTER page", async () => {
    const innate = (name: string, usesPerDay: number | null) => ({ ...spell(name, 1, 1), usesPerDay });
    const { count, mediaBoxes } = await renderPages(
      {
        ...data,
        isPlayer: false,
        classOrCr: "FP 5 (1800 XP)",
        spellcastingBlocks: [
          {
            ...data.spellcastingBlocks[0]!,
            isInnate: true,
            cantrips: [innate("Lumière", null)],
            spellsByLevel: { 1: [innate("Charme-personne", 3)], 2: [innate("Vol", 1), innate("Invisibilité", 1)] },
            slotsByLevel: {},
          },
        ],
      },
      "dark",
    );
    expect(count).toBeGreaterThanOrEqual(4);
    expect(mediaBoxes.every((box) => box === LETTER_MEDIA_BOX)).toBe(true);
  }, 30000);

  it("failure: an avatar that could not be fetched (null) still renders the full sheet", async () => {
    const { count } = await renderPages({ ...data, avatarDataUrl: null }, "dark");
    expect(count).toBe(6);
  }, 30000);
});

interface DocumentNode {
  type: unknown;
  props: Record<string, unknown>;
}

/** Expands the document element tree (function components called in place) into a flat node list. */
function collectNodes(node: React.ReactNode, out: DocumentNode[] = []): DocumentNode[] {
  if (node == null || typeof node === "boolean") return out;
  if (Array.isArray(node)) {
    for (const child of node) collectNodes(child as React.ReactNode, out);
    return out;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push({ type: "#text", props: { value: String(node) } });
    return out;
  }
  if (!React.isValidElement(node)) return out;
  const props = node.props as Record<string, unknown> & { children?: React.ReactNode };
  out.push({ type: node.type, props });
  if (typeof node.type === "function") {
    return collectNodes((node.type as (p: unknown) => React.ReactNode)(props), out);
  }
  return collectNodes(props.children, out);
}

function documentNodes(input: CharacterSheetPdfData, theme: CharacterSheetPdfTheme = "dark") {
  return collectNodes(
    <CharacterSheetPdfDocument
      data={input}
      labels={labels}
      theme={theme}
    />,
  );
}

const nodesOf = (nodes: DocumentNode[], type: unknown) => nodes.filter((node) => node.type === type);
const textsOf = (nodes: DocumentNode[]) => nodesOf(nodes, "#text").map((node) => String(node.props.value));
const flattenStyle = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style)
    ? style.flatMap(flattenStyle)
    : style && typeof style === "object"
      ? [style as Record<string, unknown>]
      : [];

describe("FR-character-sheet-pdf-export — hand-filled values and page 1 columns", () => {
  it("nominal: current HP, temp HP and remaining hit dice are blank lines to write on", () => {
    const nodes = documentNodes(data);
    const writeInLabels = nodesOf(nodes, WriteInField).map((node) => node.props.label);
    expect(writeInLabels).toEqual(expect.arrayContaining([labels.currentHp, labels.tempHp, labels.hitDiceRemaining]));
  });

  it("nominal: death saves, prepared spells and slots print no state", () => {
    const nodes = documentNodes(data);
    // Two rows of three empty dots, whatever the character's saves.
    expect(nodesOf(nodes, EmptyDots).map((node) => node.props.total)).toEqual([3, 3]);
    // The prepared count of the spell overview is a write-in line, not a number.
    const preparedStat = nodes.find((node) => node.props.label === labels.preparedSpells);
    expect(preparedStat?.props).not.toHaveProperty("value");
    // No prepared checkbox is filled (the overview fill used the Magic accent).
    const pink = CHARACTER_SHEET_PDF_THEMES.dark.pink;
    const filled = nodes.filter((node) =>
      flattenStyle(node.props.style).some((style) => style.backgroundColor === pink),
    );
    expect(filled).toHaveLength(0);
  });

  it("nominal: the remaining hit dice line sits above the hit dice pills", () => {
    const nodes = documentNodes(data);
    const remainingIndex = nodes.findIndex(
      (node) => node.type === WriteInField && node.props.label === labels.hitDiceRemaining,
    );
    const pillIndex = nodes.findIndex((node) => node.type === HitDicePill);
    expect(remainingIndex).toBeGreaterThan(-1);
    expect(remainingIndex).toBeLessThan(pillIndex);
  });

  it("nominal: a single class shows its hit dice in one pill", () => {
    const pills = nodesOf(documentNodes(data), HitDicePill);
    expect(pills.map((node) => (node.props.entry as { notation: string }).notation)).toEqual(["7d6"]);
  });

  it("edge: one pill per class for a multiclass character", () => {
    const pills = nodesOf(
      documentNodes({
        ...data,
        hitDiceEntries: [
          { notation: "5d10", className: "Guerrier" },
          { notation: "3d6", className: "Magicien" },
        ],
      }),
      HitDicePill,
    );
    expect(pills).toHaveLength(2);
  });

  it("edge: without attacks the card still holds several empty ruled rows", () => {
    const rows = nodesOf(documentNodes({ ...data, attacks: [] }), AttackRow);
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(rows.every((row) => row.props.attack === null)).toBe(true);
  });

  it("nominal: attacks fill the first rows, the damage type sits under the dice", () => {
    const nodes = documentNodes(data);
    const rows = nodesOf(nodes, AttackRow);
    expect(rows.length).toBeGreaterThan(data.attacks.length);
    expect(rows.slice(0, 2).map((row) => (row.props.attack as { name: string }).name)).toEqual([
      "Dague",
      "Trait de feu",
    ]);
    const texts = textsOf(nodes);
    expect(texts).toEqual(expect.arrayContaining(["1d4+2", "perforant"]));
    expect(texts).not.toContain("1d4+2 perforant");
  });

  it("guard: attacks beyond the ruled rows are not drawn outside the card", () => {
    const many = Array.from({ length: 40 }, (_, index) => ({
      name: `Arme ${index}`,
      bonus: "+1",
      damage: "1d6",
      damageType: "contondant",
      range: "",
    }));
    const rows = nodesOf(documentNodes({ ...data, attacks: many }), AttackRow);
    expect(rows.length).toBeLessThan(many.length);
  });

  it("edge: an attack name made of one long word is cut to fit its column", () => {
    const nameText = documentNodes(data).find((node) => typeof node.props.hyphenationCallback === "function");
    const breakWord = nameText?.props.hyphenationCallback as (word: string) => string[];
    expect(breakWord("Arbalète-lourde-enchantée-des-profondeurs").length).toBeGreaterThan(1);
    expect(breakWord("Dague")).toEqual(["Dague"]);
    expect(nameText?.props.style).toMatchObject({ maxLines: 2, textOverflow: "ellipsis" });
  });

  it("nominal: the QR code links to the character page it encodes", () => {
    const nodes = documentNodes({ ...data, qrCodeDataUrl: TINY_PNG_DATA_URL });
    const qrLink = nodesOf(nodes, Link).find((node) => node.props.src === data.characterPageUrl);
    expect(qrLink).toBeDefined();
    const [qrImage] = nodesOf(collectNodes(qrLink?.props.children as React.ReactNode), Image);
    expect(qrImage).toBeDefined();
    // The clickable box is the QR code square: same size as the image, the right inset outside it.
    const linkStyle = Object.assign({}, ...flattenStyle(qrLink?.props.style));
    const imageStyle = Object.assign({}, ...flattenStyle(qrImage?.props.style));
    expect(linkStyle.width).toBe(imageStyle.width);
    expect(linkStyle.height).toBe(imageStyle.height);
    expect(linkStyle.width).toBe(linkStyle.height);
    expect(imageStyle.marginRight).toBeUndefined();
  });

  it("edge: without a QR code there is no character page link", () => {
    const links = nodesOf(documentNodes({ ...data, qrCodeDataUrl: null }), Link);
    expect(links.some((node) => node.props.src === data.characterPageUrl)).toBe(false);
  });

  it("nominal: the treasure card ends with unbreakable blank space to write in", () => {
    const treasure = documentNodes(data).find((node) => node.props.title === labels.treasure);
    expect(treasure?.props.breakable).toBeFalsy();
    const blank = collectNodes(treasure?.props.children as React.ReactNode).find((node) =>
      flattenStyle(node.props.style).some((style) => Number(style.minHeight) >= 100),
    );
    expect(blank).toBeDefined();
  });

  it("nominal: the footer links www.chariot.tools", () => {
    const links = nodesOf(documentNodes(data), Link).filter((node) => node.props.src !== data.characterPageUrl);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.props.src).toBe(PDF_FOOTER_SITE_URL);
      expect(link.props.children).toBe(PDF_FOOTER_SITE_LABEL);
    }
    expect(PDF_FOOTER_SITE_LABEL).toBe("www.chariot.tools");
    expect(PDF_FOOTER_SITE_URL).toBe("https://www.chariot.tools");
  });
});
