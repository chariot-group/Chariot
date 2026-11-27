/** @see FR-ruleset-character-builder */

export const RULESET_STATUSES = ['draft', 'published', 'archived'] as const;
export type RulesetStatus = (typeof RULESET_STATUSES)[number];

export const BUILDER_MODES = ['creation', 'levelUp'] as const;
export type BuilderMode = (typeof BUILDER_MODES)[number];

export const FIELD_TYPES = [
  'entitySelect',
  'multiSelect',
  'grantedChoices',
  'abilityAllocation',
  'number',
  'text',
  'computed',
  'summary',
  'spellSelect',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const ABILITY_ALLOCATION_METHODS = [
  'pointBuy',
  'standardArray',
  'roll',
] as const;
export type AbilityAllocationMethod =
  (typeof ABILITY_ALLOCATION_METHODS)[number];

export const EFFECT_OPS = ['add', 'set', 'grant', 'remove', 'max'] as const;
export type EffectOp = (typeof EFFECT_OPS)[number];

export const GRANT_KINDS = ['choose'] as const;
export type GrantKind = (typeof GRANT_KINDS)[number];

/** Locales supported by Chariot (aligned with the web client i18n config). */
export const SUPPORTED_LOCALES = ['fr', 'en', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const REQUIRED_LOCALE: SupportedLocale = 'en';

/** Kebab-case identifier: ruleset key, entry type, entry key, step/field ids. */
export const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Field, formula and step ids (camelCase or kebab-case, no dots). */
export const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Roots an expression `var` may start with besides field and formula ids:
 * - `state`: computed builder state (values produced by entry effects);
 * - `repeat`: current repetition of a repeated step (`repeat.index`);
 * - `context`: builder context (`context.mode`, …);
 * - `option`: candidate entry while evaluating an `optionsFilter`;
 * - `self`: entry concerned by an effect, grant, entry value or declaration;
 * - `item`: element being built by a collection;
 * - `ruleset`: `{ key, version, data }`, static data of the ruleset.
 */
export const RESERVED_VAR_ROOTS = [
  'state',
  'repeat',
  'context',
  'option',
  'self',
  'item',
  'ruleset',
] as const;

/** State keys built by the engine itself; counters and collections cannot use them as id. */
export const GENERIC_STATE_KEYS = [
  'entries',
  'choices',
  'selected',
  'labels',
  'page',
  'spells',
] as const;

/** Standard JSON Logic operators (https://jsonlogic.com/operations.html), `log` excluded. */
export const JSON_LOGIC_OPERATORS = [
  'var',
  'missing',
  'missing_some',
  'if',
  '?:',
  '==',
  '===',
  '!=',
  '!==',
  '!',
  '!!',
  'or',
  'and',
  '>',
  '>=',
  '<',
  '<=',
  'max',
  'min',
  '+',
  '-',
  '*',
  '/',
  '%',
  'map',
  'filter',
  'reduce',
  'all',
  'none',
  'some',
  'merge',
  'in',
  'cat',
  'substr',
] as const;

/** Operators whose second argument is evaluated against each item, not the builder data. */
export const JSON_LOGIC_SCOPED_OPERATORS = [
  'map',
  'filter',
  'reduce',
  'all',
  'none',
  'some',
] as const;
