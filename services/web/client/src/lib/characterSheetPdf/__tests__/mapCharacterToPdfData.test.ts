/** @see FR-character-sheet-pdf-export */

import { describe, expect, it } from "vitest";
import { mapCharacterToPdfData } from "@/lib/characterSheetPdf/mapCharacterToPdfData";
import type { CharacterSheetPdfLabels } from "@/lib/characterSheetPdf/types";
import type { NPC, Player } from "@/types/character";

const minimalLabels: CharacterSheetPdfLabels = {
  appName: "Chariot",
  pageOf: "Page {page} / {total}",
  characterName: "Character",
  playerName: "Player",
  race: "Race",
  classAndLevel: "Class",
  background: "Background",
  alignment: "Alignment",
  experience: "XP",
  creatureType: "Type",
  challengeRating: "CR",
  armorClass: "AC",
  initiative: "Init",
  initiativeShort: "Init.",
  languages: "Languages",
  qrCodeHint: "Open sheet",
  speed: "Speed",
  maxHp: "Max HP",
  currentHp: "HP",
  tempHp: "Temp HP",
  hitPoints: "Hit Points",
  hitDice: "Hit Dice",
  hitPointsRoll: "HP Roll",
  proficiencyBonus: "Prof",
  inspiration: "Inspiration",
  passivePerception: "Passive Perception",
  deathSaves: "Death Saves",
  successes: "Successes",
  failures: "Failures",
  abilities: "Abilities",
  savingThrows: "Saves",
  skills: "Skills",
  attacksAndSpellcasting: "Attacks",
  equipment: "Equipment",
  proficienciesAndLanguages: "Proficiencies",
  senses: "Senses",
  tools: "Tools",
  weapons: "Weapons",
  armors: "Armors",
  featuresAndTraits: "Features",
  appearance: "Appearance",
  personalityTraits: "Traits",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  alliesAndOrganizations: "Allies",
  backstory: "Backstory",
  treasure: "Treasure",
  additionalFeatures: "Extra",
  spellcastingClass: "Class",
  spellcastingAbility: "Ability",
  spellSaveDc: "DC",
  spellAttackBonus: "Attack",
  spellLevel: "Level",
  spellName: "Spell",
  attackName: "Name",
  attackBonusHeader: "Bonus",
  attackDamageHeader: "Dmg / type",
  proficienciesContinuation: "Proficiencies (cont.)",
  equipmentContinuation: "Equipment (cont.)",
  cantrips: "Cantrips",
  preparedSpells: "Prepared",
  spellSlots: "Slots",
  slotsUsed: "Used",
  slotsTotal: "Total",
  cp: "CP",
  sp: "SP",
  ep: "EP",
  gp: "GP",
  pp: "PP",
  age: "Age",
  height: "Height",
  weight: "Weight",
  eyes: "Eyes",
  skin: "Skin",
  hair: "Hair",
  abilityNames: {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma",
  },
  abilityAbbr: {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA",
  },
  skillNames: {
    athletics: "Athletics",
    acrobatics: "Acrobatics",
    animalHandling: "Animal Handling",
    arcana: "Arcana",
    deception: "Deception",
    history: "History",
    intimidation: "Intimidation",
    insight: "Insight",
    investigation: "Investigation",
    medicine: "Medicine",
    nature: "Nature",
    perception: "Perception",
    persuasion: "Persuasion",
    religion: "Religion",
    performance: "Performance",
    sleightHand: "Sleight of Hand",
    stealth: "Stealth",
    survival: "Survival",
  },
  yes: "Yes",
  no: "No",
};

const basePlayer: Player = {
  _id: "p1",
  firstname: "Aragorn",
  lastname: "Elessar",
  surname: "",
  avatar: "",
  gameSystem: "DND_5E",
  stats: {
    size: "Medium",
    maxHitPoints: 45,
    currentHitPoints: 40,
    tempHitPoints: 0,
    armorClass: 16,
    initiative: 2,
    speed: { walk: 30, climb: 0, swim: 0, fly: 0, burrow: 0 },
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 12,
    },
    languages: ["Common"],
    passivePerception: 11,
    savingThrows: { strength: 2, dexterity: 0, constitution: 2, intelligence: 0, wisdom: 0, charisma: 0 },
    skills: {
      athletics: 0,
      acrobatics: 0,
      sleightHand: 0,
      stealth: 0,
      arcana: 0,
      history: 0,
      investigation: 0,
      nature: 0,
      religion: 0,
      animalHandling: 0,
      insight: 0,
      medicine: 0,
      perception: 0,
      survival: 0,
      deception: 0,
      intimidation: 0,
      performance: 0,
      persuasion: 0,
    },
    senses: [],
    proficiencyBonus: 2,
    armors: [],
    weapons: [],
    tools: [],
    masteries: {
      athletics: 2,
      acrobatics: 0,
      sleightHand: 0,
      stealth: 0,
      arcana: 0,
      history: 0,
      investigation: 0,
      nature: 0,
      religion: 0,
      animalHandling: 0,
      insight: 0,
      medicine: 0,
      perception: 0,
      survival: 0,
      deception: 0,
      intimidation: 0,
      performance: 0,
      persuasion: 0,
    },
    masteriesAbility: {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },
  },
  affinities: { resistances: [], immunities: [], vulnerabilities: [] },
  abilities: [],
  spellcasting: [
    {
      className: "Wizard",
      ability: "intelligence",
      saveDC: 13,
      attackBonus: 5,
      spellSlotsByLevel: { "1": { total: 2, used: 1 } },
      totalSlots: 2,
      spells: [{ name: "Magic Missile", level: 1, school: "", description: "", components: [], castingTime: "", duration: "", range: "", effectType: "attack", prepared: true }],
    },
  ],
  appearance: {},
  background: {},
  treasure: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0, treasure: "", equipment: "Sword" },
  conditions: {
    blinded: false,
    charmed: false,
    deafened: false,
    frightened: false,
    grappled: false,
    incapacitated: false,
    invisible: false,
    paralyzed: false,
    petrified: false,
    poisoned: false,
    prone: false,
    restrained: false,
    stunned: false,
    unconscious: false,
  },
  groups: [],
  actions: [],
  inspiration: true,
  progression: { level: 5, experience: 6500 },
  class: [{ name: "Fighter", subclass: "", level: 5, hitDice: 10 }],
  profile: { alignment: "Lawful Good", race: "Human", subrace: "", history: "Soldier" },
  exhaustionLevel: 0,
  deathSaves: { successes: 1, failures: 0 },
};

describe("FR-character-sheet-pdf-export — mapCharacterToPdfData", () => {
  const mapOptions = {
    labels: minimalLabels,
    translateClass: (n: string) => n,
    formatClassLevel: (className: string, level: number) => `${className} Lv.${level}`,
    translateAlignment: (a: string) => a,
  };

  it("nominal: maps player with spellcasting and athletics mastery bonus +5", () => {
    const data = mapCharacterToPdfData(basePlayer, mapOptions);
    expect(data.isPlayer).toBe(true);
    expect(data.displayName).toBe("Aragorn Elessar");
    expect(data.hasSpellcasting).toBe(true);
    expect(data.inspiration).toBe(true);
    expect(data.race).toBe("Human");
    expect(data.subrace).toBe("");
    expect(data.classPrimary).toBe("Fighter Lv.5");
    const athletics = data.skills.find((s) => s.key === "athletics");
    expect(athletics?.bonus).toBe("+5");
    expect(athletics?.proficient).toBe(true);
    expect(athletics?.masteryLevel).toBe(2);
  });

  it("edge: splits race/subrace and class/subclass for header display", () => {
    const player = {
      ...basePlayer,
      profile: { ...basePlayer.profile, race: "Elf", subrace: "Wood Elf" },
      class: [{ name: "Ranger", subclass: "Hunter", level: 3, hitDice: 10 }],
    };
    const data = mapCharacterToPdfData(player, mapOptions);
    expect(data.race).toBe("Elf");
    expect(data.subrace).toBe("Wood Elf");
    expect(data.classPrimary).toBe("Ranger Lv.3");
    expect(data.subclassPrimary).toBe("Hunter");
  });

  it("nominal: maps senses, tools, weapons and armors for the proficiencies card", () => {
    const player = {
      ...basePlayer,
      stats: {
        ...basePlayer.stats,
        languages: ["Commun", "Elfique"],
        senses: [
          { name: "Vision dans le noir", value: 60 },
          { name: "Perception aveugle", value: null },
        ],
        tools: ["Outils de calligraphe"],
        weapons: ["Dague", "Bâton"],
        armors: ["Armures légères"],
      },
    } as Player;

    const data = mapCharacterToPdfData(player, mapOptions);
    expect(data.languages).toBe("Commun, Elfique");
    expect(data.senses).toBe("Vision dans le noir (60 ft), Perception aveugle");
    expect(data.tools).toBe("Outils de calligraphe");
    expect(data.weapons).toBe("Dague, Bâton");
    expect(data.armors).toBe("Armures légères");
  });

  it("edge: empty senses/tools/weapons/armors map to empty strings", () => {
    const data = mapCharacterToPdfData(basePlayer, mapOptions);
    expect(data.senses).toBe("");
    expect(data.tools).toBe("");
    expect(data.weapons).toBe("");
    expect(data.armors).toBe("");
  });

  it("edge: maps multiclass entries for header and hit dice display", () => {
    const player = {
      ...basePlayer,
      class: [
        { name: "Fighter", subclass: "Champion", level: 5, hitDice: 10, hitDiceRemaining: 3 },
        { name: "Wizard", subclass: "Evocation", level: 3, hitDice: 6, hitDiceRemaining: 2 },
      ],
    };
    const data = mapCharacterToPdfData(player, mapOptions);

    expect(data.classEntries).toHaveLength(2);
    expect(data.classEntries[0]).toMatchObject({ name: "Fighter", subclass: "Champion", level: 5, label: "Fighter Lv.5" });
    expect(data.classEntries[1]).toMatchObject({ name: "Wizard", subclass: "Evocation", level: 3, label: "Wizard Lv.3" });
    expect(data.classPrimary).toBe("Fighter Lv.5 / Wizard Lv.3");
    expect(data.hitDiceEntries).toEqual([
      { notation: "3d10", className: "Fighter" },
      { notation: "2d6", className: "Wizard" },
    ]);
    expect(data.hitDice).toBe("3d10 (Fighter), 2d6 (Wizard)");
  });

  it("nominal: maps NPC with CR and without death saves", () => {
    const npc: NPC = {
      _id: "n1",
      firstname: "Goblin",
      lastname: "",
      surname: "",
      avatar: "",
      gameSystem: "DND_5E",
      stats: basePlayer.stats,
      affinities: basePlayer.affinities,
      abilities: [],
      spellcasting: [],
      appearance: {},
      background: {},
      treasure: basePlayer.treasure,
      conditions: basePlayer.conditions,
      groups: [],
      actions: { standard: [], legendary: [], lair: [] },
      challenge: { challengeRating: 0.25, experiencePoints: 50 },
      profile: { alignment: "Unaligned", type: "Humanoid", subtype: "Goblin" },
      hitPointsRoll: "2d6+2",
    };

    const data = mapCharacterToPdfData(npc, mapOptions);
    expect(data.isPlayer).toBe(false);
    expect(data.classOrCr).toContain("1/4");
    expect(data.deathSaveSuccesses).toBe(0);
    expect(data.hitDice).toBe("2d6+2");
  });

  it("edge: character without spellcasting omits spell page flag", () => {
    const playerNoMagic = { ...basePlayer, spellcasting: [] };
    const data = mapCharacterToPdfData(playerNoMagic, mapOptions);
    expect(data.hasSpellcasting).toBe(false);
  });

  it("nominal: passes avatar, QR, and character page URL through export data", () => {
    const data = mapCharacterToPdfData(basePlayer, {
      ...mapOptions,
      avatarDataUrl: "data:image/png;base64,abc",
      qrCodeDataUrl: "data:image/png;base64,qr",
      characterPageUrl: "https://chariot.tools/fr/characters/p1",
    });

    expect(data.avatarDataUrl).toBe("data:image/png;base64,abc");
    expect(data.qrCodeDataUrl).toBe("data:image/png;base64,qr");
    expect(data.characterPageUrl).toBe("https://chariot.tools/fr/characters/p1");
  });
});
