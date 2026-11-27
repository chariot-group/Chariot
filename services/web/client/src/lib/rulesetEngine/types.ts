/**
 * Types of the generic character builder engine.
 * Shapes mirror the adventure service ruleset API (`services/adventure/api/src/resources/ruleset/`).
 *
 * @see FR-ruleset-character-builder — Builder engine
 */

export const RULESET_LOCALES = ["fr", "en", "es"] as const;
export type RulesetLocale = (typeof RULESET_LOCALES)[number];
export const RULESET_DEFAULT_LOCALE: RulesetLocale = "en";

/** Translated text stored in a ruleset (`en` mandatory). */
export type TranslatedText = Partial<Record<RulesetLocale, string>> & { en: string };

/** A JSON Logic expression or a literal value. */
export type Expression = unknown;

export type BuilderMode = "creation" | "levelUp";

export type FieldType =
  | "entitySelect"
  | "multiSelect"
  | "grantedChoices"
  | "abilityAllocation"
  | "number"
  | "text"
  | "computed"
  | "summary"
  | "spellSelect";

export type AbilityAllocationMethod = "pointBuy" | "standardArray" | "roll";

export type EntrySource = { type: string; parentKey?: string };

export type SpellFilter = { className?: Expression; minLevel?: Expression; maxLevel?: Expression };

export type BuilderField = {
  id: string;
  type: FieldType;
  label: TranslatedText;
  help?: TranslatedText;
  source?: EntrySource;
  count?: Expression;
  from?: string;
  methods?: AbilityAllocationMethod[];
  spellFilter?: SpellFilter;
  /** `spellSelect` only: group of the chosen spells in `state.spells` (default: evaluated `spellFilter.className`). */
  spellGroup?: Expression;
  locked?: boolean;
  formula?: Expression;
  visibleWhen?: Expression;
  requiredWhen?: Expression;
  default?: Expression;
  optionsFilter?: Expression;
  validation?: Expression;
  config?: Record<string, unknown>;
};

export type BuilderStep = {
  id: string;
  order: number;
  title: TranslatedText;
  breadcrumb: TranslatedText;
  description?: TranslatedText;
  modes: BuilderMode[];
  visibleWhen?: Expression;
  repeat?: { from: Expression; to: Expression };
  fields: BuilderField[];
  /** Fields shown together in one titled card. */
  cards?: StepCard[];
};

export type StepCard = { id: string; title: TranslatedText; description?: TranslatedText; fields: string[] };

/** Card of a page with its texts in the user's locale. */
export type EvaluatedCard = { id: string; title: string; description?: string; fields: string[] };

export type RulesetFormula = { id: string; expression: Expression };
export type RulesetProjection = { source: Expression; target: string };

/** Level of a selected entry of `type`, evaluated with `self` = the entry. */
export type RulesetLevel = { type: string; expression: Expression };
/** Children of `childType` attached to a selected `parentType` entry (by `parentKey`). */
export type RulesetAttachment = { childType: string; parentType: string; when?: Expression };
/** Counts the values chosen across `fields`: `state.<id>` = `{ keys, distinct, total, of }`. */
export type RulesetCounter = { id: string; fields: string[] };
/** Builds `state.<id>`: one object per element; `item` maps dotted target paths to expressions. */
export type RulesetCollection = {
  id: string;
  from: { types?: string[]; path?: string };
  where?: Expression;
  sort?: Expression;
  item: Record<string, Expression>;
};

export type BuilderRuleset = {
  key: string;
  version: number;
  flow: { steps: BuilderStep[] };
  formulas?: RulesetFormula[];
  projection?: RulesetProjection[];
  /** Static data, read as `ruleset.data.*`. */
  data?: Record<string, unknown>;
  levels?: RulesetLevel[];
  attachments?: RulesetAttachment[];
  counters?: RulesetCounter[];
  collections?: RulesetCollection[];
};

export type EffectOp = "add" | "set" | "grant" | "remove" | "max";

export type EntryEffect = { op: EffectOp; target: string; value?: unknown; when?: Expression };

export type EntryGrant = {
  id: string;
  kind: "choose";
  /** Name of the choice for the player (e.g. « Sous-race »). */
  label?: TranslatedText;
  /** What the choice is and what it implies. */
  description?: TranslatedText;
  /** Suggested option keys, or JSON Logic giving them. */
  default?: Expression;
  from: { type: string; parentKey?: string; keys?: string[] };
  count: Expression;
  level?: number;
  when?: Expression;
  effects?: EntryEffect[];
};

export type RulesetEntry = {
  type: string;
  key: string;
  parentKey?: string;
  label: TranslatedText;
  description?: TranslatedText;
  level?: number;
  tags?: string[];
  data?: Record<string, unknown>;
  /** Named expressions evaluated with `self` = the entry. */
  values?: Record<string, Expression>;
  effects?: EntryEffect[];
  grants?: EntryGrant[];
};

/** Entry as seen by expressions and the UI: texts resolved in the user's locale. */
export type ResolvedEntry = {
  type: string;
  key: string;
  parentKey?: string;
  label: string;
  description?: string;
  level?: number;
  tags: string[];
  data: Record<string, unknown>;
  /** Evaluated `values` (options shown in the field output only). */
  values?: Record<string, unknown>;
};

/** One answer per field id; a field of a repeated step holds `{ [repeatIndex]: value }`. */
export type BuilderAnswers = Record<string, unknown>;

/** Answer of a `grantedChoices` field: chosen option keys per grant id. */
export type GrantedChoicesAnswer = Record<string, string[]>;

/** Answer of an `abilityAllocation` field. */
export type AbilityAllocationAnswer = { method?: AbilityAllocationMethod; scores?: Record<string, number | null> };

/** Spell picked in a `spellSelect` field, from the Codex or entered manually. */
export type SpellChoice = { source: "codex" | "manual"; name: string; level: number; codexId?: string } & Record<
  string,
  unknown
>;

export type BuilderContext = {
  mode: BuilderMode;
  locale: RulesetLocale;
  /** Level of the character before a level-up (`levelUp` mode). */
  currentLevel?: number;
  /** Level reached at the end of the level-up (`levelUp` mode). */
  targetLevel?: number;
};

export type BuilderInput = {
  ruleset: BuilderRuleset;
  entries: RulesetEntry[];
  answers: BuilderAnswers;
  context: BuilderContext;
  /** `levelUp` mode: answers saved when the character was created or last levelled up. */
  savedAnswers?: BuilderAnswers;
};

export type IssueSeverity = "error" | "warning";

export type IssueCode =
  | "required"
  | "validation-failed"
  | "unknown-entry"
  | "answer-dropped"
  | "invalid-value"
  | "expression-error"
  | "unstable-state"
  | "invalid-repeat"
  | "count-not-reached"
  | "count-exceeded"
  | "allocation-incomplete"
  | "allocation-method"
  | "point-buy-budget"
  | "point-buy-range"
  | "standard-array-mismatch"
  | "roll-range";

export type BuilderIssue = {
  code: IssueCode;
  severity: IssueSeverity;
  stepId?: string;
  fieldId?: string;
  formulaId?: string;
  /** Repetition index of the page, for a field of a repeated step. */
  index?: number;
  grantId?: string;
  message?: string;
};

export type EvaluatedGrant = {
  /** Unique on the page: the chain of choices that offers the grant (the same grant id can be offered twice). */
  key: string;
  id: string;
  /** Grant label in the user's locale. */
  label?: string;
  /** Grant description in the user's locale. */
  description?: string;
  /** The chosen options are the suggestion (no answer yet). */
  suggested: boolean;
  ownerKey: string;
  ownerLabel: string;
  options: ResolvedEntry[];
  expectedCount: number;
  chosen: string[];
};

export type EvaluatedField = {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  required: boolean;
  locked: boolean;
  /** Suggestion derived by the ruleset (`default` or `formula`). */
  suggestion: unknown;
  /** Answer if the player gave one, suggestion otherwise. */
  value: unknown;
  answered: boolean;
  options?: ResolvedEntry[];
  expectedCount?: number;
  count?: number;
  grants?: EvaluatedGrant[];
  spellFilter?: { className?: unknown; minLevel?: unknown; maxLevel?: unknown };
  methods?: AbilityAllocationMethod[];
  config?: Record<string, unknown>;
};

export type EvaluatedPage = {
  /** `stepId` or `stepId:index` for a repeated step. */
  key: string;
  stepId: string;
  index?: number;
  title: string;
  breadcrumb: string;
  description?: string;
  fields: EvaluatedField[];
  cards: EvaluatedCard[];
  complete: boolean;
};

export type BuilderEvaluation = {
  pages: EvaluatedPage[];
  state: Record<string, unknown>;
  formulas: Record<string, unknown>;
  /** Partial `Player` sheet suggested by the projection. */
  sheet: Record<string, unknown>;
  issues: BuilderIssue[];
};
