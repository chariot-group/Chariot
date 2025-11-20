import INpc from "@/models/npc/INpc";
import IPlayer from "@/models/player/IPlayer";
import ISavingThrows from "@/models/npc/stat/sub/ISavingThrows";
import ISkills from "@/models/npc/stat/sub/ISkills";
import IAbilityScores from "@/models/npc/stat/sub/IAbilityScores";

export const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const;

export type Size = (typeof SIZES)[number];

export const DEFAULT_PLAYER: IPlayer = {
  _id: "",
  name: "Roger",
  kind: "player",
  affinities: {
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  },
  abilities: [],
  spellcasting: [],
  groups: [],
  inspiration: false,
  progression: {
    level: 1,
    experience: 0,
  },
  class: [],
  profile: {
    race: "",
  },
  appearance: {
    height: 0,
  },
  background: {
    ideals: "",
  },
  treasure: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  },
  stats: {
    masteriesAbility: {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },
    proficiencyBonus: 0,
    size: SIZES[0],
    maxHitPoints: 10,
    currentHitPoints: 10,
    tempHitPoints: 0,
    armorClass: 10,
    speed: {
      walk: 30,
    },
    abilityScores: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    languages: [],
    passivePerception: 0,
    savingThrows: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    masteries: {
      acrobatics: false,
      animalHandling: false,
      arcana: false,
      athletics: false,
      deception: false,
      history: false,
      insight: false,
      intimidation: false,
      investigation: false,
      medicine: false,
      nature: false,
      perception: false,
      performance: false,
      persuasion: false,
      religion: false,
      sleightHand: false,
      stealth: false,
      survival: false,
    },
    skills: {
      acrobatics: 0,
      animalHandling: 0,
      arcana: 0,
      athletics: 0,
      deception: 0,
      history: 0,
      insight: 0,
      intimidation: 0,
      investigation: 0,
      medicine: 0,
      nature: 0,
      perception: 0,
      performance: 0,
      persuasion: 0,
      religion: 0,
      sleightHand: 0,
      stealth: 0,
      survival: 0,
    },
    senses: [],
  },
};

export const DEFAULT_NPC: INpc = {
  _id: "",
  name: "Cultist",
  kind: "npc",
  affinities: {
    resistances: [],
    vulnerabilities: [],
    immunities: [],
  },
  abilities: [],
  spellcasting: [],
  groups: [],
  actions: {
    standard: [],
    legendary: [],
    lair: [],
  },
  challenge: {
    challengeRating: 0,
  },
  stats: {
    size: SIZES[0],
    maxHitPoints: 10,
    currentHitPoints: 10,
    tempHitPoints: 0,
    armorClass: 10,
    speed: {
      walk: 30,
    },
    abilityScores: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    languages: [],
    passivePerception: 0,
    savingThrows: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    skills: {
      acrobatics: 0,
      animalHandling: 0,
      arcana: 0,
      athletics: 0,
      deception: 0,
      history: 0,
      insight: 0,
      intimidation: 0,
      investigation: 0,
      medicine: 0,
      nature: 0,
      perception: 0,
      performance: 0,
      persuasion: 0,
      religion: 0,
      sleightHand: 0,
      stealth: 0,
      survival: 0,
    },
    senses: [],
  },
  profile: {
    type: "",
  },
};

export const LANGUAGES: string[] = [
  "common",
  "dwarvish",
  "elvish",
  "giant",
  "gnomish",
  "goblin",
  "orc",
  "abyssal",
  "celestial",
  "draconic",
  "deepSpeech",
  "infernal",
  "primordial",
  "sylvan",
  "undercommon"
];

export const CHARACTERISTICS_LINKS: Record<keyof ISavingThrows, (keyof ISkills)[]> = {
  "dexterity": [
    "acrobatics",
    "stealth",
    "sleightHand"
  ],
  "intelligence": [
    "arcana",
    "history",
    "nature",
    "religion",
    "investigation"
  ],
  "strength": [
    "athletics"
  ],
  "wisdom": [
    "animalHandling",
    "insight",
    "medicine",
    "perception",
    "survival"
  ],
  "charisma": [
    "intimidation",
    "persuasion",
    "performance",
    "deception"
  ],
  "constitution": [],
}

export function getSkillsFor(characteristic: keyof IAbilityScores): (keyof ISkills)[] {
  return CHARACTERISTICS_LINKS[characteristic];
}

export const ALIGNMENTS: string[] = [
  "lawful_good",
  "neutral_good",
  "chaotic_good",
  "lawful_neutral",
  "neutral",
  "chaotic_neutral",
  "lawful_evil",
  "neutral_evil",
  "chaotic_evil"
];
