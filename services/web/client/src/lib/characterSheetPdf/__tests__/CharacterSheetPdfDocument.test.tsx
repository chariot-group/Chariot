/** @see FR-character-sheet-pdf-export */

import fs from "node:fs";
import path from "node:path";
import React from "react";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { CharacterSheetPdfDocument } from "@/lib/characterSheetPdf/CharacterSheetPdfDocument";
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
  inspiration: true,
  proficiencyBonus: "+3",
  abilities: [
    ["FOR", "Force", 8, "-1"],
    ["DEX", "Dextérité", 14, "+2"],
    ["CON", "Constitution", 13, "+1"],
    ["INT", "Intelligence", 18, "+4"],
    ["SAG", "Sagesse", 12, "+1"],
    ["CHA", "Charisme", 10, "+0"],
  ].map(([abbr, name, score, modifier]) => ({ abbr: String(abbr), name: String(name), score: Number(score), modifier: String(modifier) })),
  savingThrows: ["FOR", "DEX", "CON", "INT", "SAG", "CHA"].map((abbr, i) => ({ abbr, bonus: `+${i}`, proficient: i === 3, masteryLevel: i === 3 ? 1 : 0 })),
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
  currentHp: "38",
  tempHp: "0",
  hitDice: "7d6",
  deathSaveSuccesses: 1,
  deathSaveFailures: 0,
  attacks: [
    { name: "Dague", bonus: "+5", damage: "1d4+2 perforant", range: "6 m" },
    { name: "Trait de feu", bonus: "+7", damage: "2d10 feu", range: "36 m" },
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
    { name: "Restauration arcanique", description: "Une fois par jour, après un repos court, récupère des emplacements de sorts." },
    { name: "Sculpter les sorts", description: "Protège des alliés des effets de vos sorts d'évocation." },
  ],
  appearance: { age: "112", height: "1,75 m", weight: "60 kg", eyes: "Verts", skin: "Pâle", hair: "Argent", description: "Silhouette élancée, toujours couverte d'encre." },
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
      slotsByLevel: { 1: { used: 1, total: 4 }, 2: { used: 0, total: 3 }, 3: { used: 2, total: 3 }, 4: { used: 0, total: 1 } },
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
    React.createElement(CharacterSheetPdfDocument, { data: input, labels, theme }) as Parameters<typeof renderToBuffer>[0],
  );
  const raw = buffer.toString("latin1");
  return {
    count: raw.match(/\/Type \/Page\b/g)?.length ?? 0,
    mediaBoxes: raw.match(/\/MediaBox \[[^\]]*\]/g) ?? [],
  };
}

const LETTER_MEDIA_BOX = "/MediaBox [0 0 612 792]";

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
});
