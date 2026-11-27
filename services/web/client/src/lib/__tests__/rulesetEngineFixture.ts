import type { BuilderRuleset, RulesetEntry } from "@/lib/rulesetEngine/types";

/**
 * Small synthetic ruleset for the builder engine tests (no game-system content).
 * @see FR-ruleset-character-builder — Builder engine
 */

const t = (en: string, fr?: string) => (fr ? { en, fr } : { en });

export const fixtureRuleset: BuilderRuleset = {
  key: "test-ruleset",
  version: 1,
  flow: {
    steps: [
      {
        id: "race",
        order: 1,
        title: t("Race", "Peuple"),
        breadcrumb: t("Race", "Peuple"),
        modes: ["creation"],
        fields: [
          {
            id: "race",
            type: "entitySelect",
            label: t("Race", "Peuple"),
            source: { type: "race" },
            requiredWhen: true,
          },
          { id: "raceChoices", type: "grantedChoices", label: t("Race choices"), from: "race" },
          {
            id: "racePageClass",
            type: "computed",
            label: t("Class seen"),
            formula: { var: ["state.entries.class.key", "none"] },
          },
        ],
      },
      {
        id: "class",
        order: 2,
        title: t("Class", "Classe"),
        breadcrumb: t("Class", "Classe"),
        modes: ["creation"],
        fields: [
          {
            id: "class",
            type: "entitySelect",
            label: t("Class", "Classe"),
            source: { type: "class" },
            requiredWhen: true,
          },
          {
            id: "targetLevel",
            type: "number",
            label: t("Level"),
            default: 1,
            requiredWhen: true,
            validation: { and: [{ ">=": [{ var: "targetLevel" }, 1] }, { "<=": [{ var: "targetLevel" }, 20] }] },
          },
          { id: "classChoices", type: "grantedChoices", label: t("Class choices"), from: "class" },
          {
            id: "classPageConstitutionBonus",
            type: "computed",
            label: t("Constitution bonus"),
            formula: { var: ["state.abilityBonuses.constitution", 0] },
            locked: true,
          },
        ],
      },
      {
        id: "abilities",
        order: 3,
        title: t("Abilities"),
        breadcrumb: t("Abilities"),
        modes: ["creation"],
        fields: [
          {
            id: "abilityScores",
            type: "abilityAllocation",
            label: t("Ability scores"),
            methods: ["pointBuy", "standardArray", "roll"],
            requiredWhen: true,
            config: {
              abilities: ["strength", "constitution", "wisdom"],
              standardArray: [15, 14, 13],
              roll: { min: 3, max: 18 },
              pointBuy: { budget: 10, min: 8, max: 15, costs: { "8": 0, "13": 5, "14": 7, "15": 9 } },
            },
          },
          { id: "strengthTotal", type: "computed", label: t("Strength"), formula: { var: "strength" } },
        ],
      },
      {
        id: "level-up",
        order: 4,
        title: t("Level {repeat.index}", "Niveau {repeat.index}"),
        breadcrumb: t("Level {repeat.index}"),
        modes: ["creation", "levelUp"],
        repeat: {
          from: {
            if: [{ "==": [{ var: "context.mode" }, "levelUp"] }, { "+": [{ var: "context.currentLevel" }, 1] }, 2],
          },
          to: { var: "characterLevel" },
        },
        fields: [
          {
            id: "levelClass",
            type: "entitySelect",
            label: t("Class"),
            source: { type: "class" },
            default: { var: "class" },
          },
          {
            id: "hitPoints",
            type: "number",
            label: t("Hit points"),
            default: { "+": [5, { var: "constitutionModifier" }] },
            requiredWhen: true,
          },
        ],
      },
      {
        id: "summary",
        order: 5,
        title: t("Summary"),
        breadcrumb: t("Summary"),
        modes: ["creation", "levelUp"],
        fields: [{ id: "summary", type: "summary", label: t("Summary") }],
      },
    ],
  },
  formulas: [
    {
      id: "strength",
      expression: { "+": [{ var: ["abilityScores.strength", 10] }, { var: ["state.abilityBonuses.strength", 0] }] },
    },
    {
      id: "constitution",
      expression: {
        "+": [{ var: ["abilityScores.constitution", 10] }, { var: ["state.abilityBonuses.constitution", 0] }],
      },
    },
    {
      id: "constitutionModifier",
      expression: {
        "/": [
          {
            "-": [
              { "-": [{ var: "constitution" }, 10] },
              { "%": [{ "+": [{ "%": [{ "-": [{ var: "constitution" }, 10] }, 2] }, 2] }, 2] },
            ],
          },
          2,
        ],
      },
    },
    {
      id: "characterLevel",
      expression: {
        if: [
          { "==": [{ var: "context.mode" }, "levelUp"] },
          { var: "context.targetLevel" },
          { var: ["targetLevel", 1] },
        ],
      },
    },
    {
      id: "maxHitPoints",
      expression: {
        "+": [
          10,
          { var: "constitutionModifier" },
          { reduce: [{ var: ["hitPoints", []] }, { "+": [{ var: "current" }, { var: "accumulator" }] }, 0] },
        ],
      },
    },
  ],
  projection: [
    { source: { var: "state.entries.race.label" }, target: "profile.race" },
    { source: { var: "state.choices.dwarf-subrace.0.label" }, target: "profile.subrace" },
    { source: { var: "strength" }, target: "stats.abilityScores.strength" },
    { source: { var: "constitution" }, target: "stats.abilityScores.constitution" },
    { source: { var: ["state.labels.languages", []] }, target: "stats.languages" },
    { source: { var: ["state.skills.athletics", 0] }, target: "stats.masteries.athletics" },
    { source: { "!!": [{ var: "state.savingThrows.strength" }] }, target: "stats.masteriesAbility.strength" },
    { source: { var: "maxHitPoints" }, target: "stats.maxHitPoints" },
    { source: { var: "characterLevel" }, target: "progression.level" },
    { source: { var: "missingField" }, target: "profile.nothing" },
  ],
};

export const fixtureEntries: RulesetEntry[] = [
  {
    type: "race",
    key: "dwarf",
    label: t("Dwarf", "Nain"),
    effects: [
      { op: "add", target: "abilityBonuses.constitution", value: 2 },
      { op: "grant", target: "languages", value: ["common", "dwarvish"] },
    ],
    grants: [{ id: "dwarf-subrace", kind: "choose", from: { type: "subrace", parentKey: "dwarf" }, count: 1 }],
  },
  {
    type: "race",
    key: "elf",
    label: t("Elf", "Elfe"),
    effects: [{ op: "add", target: "abilityBonuses.strength", value: 1 }],
    grants: [{ id: "elf-subrace", kind: "choose", from: { type: "subrace", parentKey: "elf" }, count: 1 }],
  },
  {
    type: "subrace",
    key: "hill-dwarf",
    parentKey: "dwarf",
    label: t("Hill dwarf", "Nain des collines"),
    effects: [{ op: "add", target: "abilityBonuses.wisdom", value: 1 }],
    grants: [
      {
        id: "hill-dwarf-language",
        kind: "choose",
        from: { type: "language", keys: ["elvish", "giant"] },
        count: 1,
        effects: [{ op: "grant", target: "languages", value: ["{key}"] }],
      },
    ],
  },
  { type: "subrace", key: "high-elf", parentKey: "elf", label: t("High elf", "Haut-elfe") },
  {
    type: "class",
    key: "fighter",
    label: t("Fighter", "Guerrier"),
    data: { hitDie: 10 },
    effects: [{ op: "set", target: "savingThrows.strength", value: true }],
    grants: [
      {
        id: "fighter-skills",
        kind: "choose",
        from: { type: "skill", keys: ["athletics", "perception", "history"] },
        count: 2,
        effects: [{ op: "set", target: "skills.{key}", value: 2 }],
      },
    ],
  },
  { type: "class", key: "wizard", label: t("Wizard", "Magicien"), data: { hitDie: 6 } },
  { type: "skill", key: "athletics", label: t("Athletics", "Athlétisme") },
  { type: "skill", key: "perception", label: t("Perception") },
  { type: "skill", key: "history", label: t("History", "Histoire") },
  { type: "language", key: "common", label: t("Common", "Commun") },
  { type: "language", key: "dwarvish", label: t("Dwarvish", "Nain") },
  { type: "language", key: "elvish", label: t("Elvish", "Elfique") },
  { type: "language", key: "giant", label: t("Giant", "Géant") },
];
