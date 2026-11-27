import { createHash } from 'crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { GameSystem } from '@/common/constants/game-system.constant';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';
import { CreateRulesetEntryDto } from '@/resources/ruleset/dto/ruleset-entry.dto';
import { GENERIC_STATE_KEYS } from '@/resources/ruleset/constants/ruleset.constant';
import {
  RulesetLike,
  validateEntryIntegrity,
  validateRulesetIntegrity,
} from '@/resources/ruleset/validation/ruleset-integrity';

/** @see FR-ruleset-character-builder — Seed import */

const SEED_ROOT = __dirname;

export type SeedEntry = Record<string, unknown> & {
  type: string;
  key: string;
  parentKey?: string;
  data?: Record<string, unknown>;
  grants?: {
    id: string;
    count: unknown;
    from: { type: string; parentKey?: string; keys?: string[] };
  }[];
};

export type SeedRuleset = RulesetLike & {
  [field: string]: unknown;
  key: string;
  gameSystem: GameSystem;
  version: number;
};

export type RulesetSeed = {
  dir: string;
  ruleset: SeedRuleset;
  entries: SeedEntry[];
};

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, 'utf8')) as T;

/** Reads one seed folder: `ruleset.json` plus every `entries/*.json`. */
export function loadSeed(dir: string): RulesetSeed {
  const entriesDir = join(dir, 'entries');
  const files = existsSync(entriesDir)
    ? readdirSync(entriesDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];
  return {
    dir,
    ruleset: readJson<SeedRuleset>(join(dir, 'ruleset.json')),
    entries: files.flatMap((f) => readJson<SeedEntry[]>(join(entriesDir, f))),
  };
}

/** Every seed folder (a sub-folder holding a `ruleset.json`) of the root. */
export function loadSeeds(root: string = SEED_ROOT): RulesetSeed[] {
  return readdirSync(root)
    .map((name) => join(root, name))
    .filter(
      (dir) =>
        statSync(dir).isDirectory() && existsSync(join(dir, 'ruleset.json')),
    )
    .sort()
    .map(loadSeed);
}

const flattenErrors = (errors: ValidationError[], prefix = ''): string[] =>
  errors.flatMap((e) => {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    return [
      ...Object.values(e.constraints ?? {}).map((m) => `${path}: ${m}`),
      ...flattenErrors(e.children ?? [], path),
    ];
  });

const dtoErrors = (cls: new () => object, plain: object): string[] =>
  flattenErrors(
    validateSync(plainToInstance(cls, plain), {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

/** The ruleset fields accepted by the create DTO (meta fields excluded). */
export function rulesetContent(ruleset: SeedRuleset) {
  const {
    key,
    gameSystem,
    name,
    description,
    flow,
    formulas,
    projection,
    data,
    levels,
    attachments,
    counters,
    collections,
  } = ruleset;
  return {
    key,
    gameSystem,
    name,
    description,
    flow,
    formulas,
    projection,
    data,
    levels,
    attachments,
    counters,
    collections,
  };
}

/**
 * Same checks as the admin API (DTOs and integrity) plus the cross-entry
 * checks only a full seed allows: unique keys, parents and grant targets.
 */
export function validateSeed(seed: RulesetSeed): string[] {
  const { ruleset, entries } = seed;
  const errors: string[] = [];

  if (!Number.isInteger(ruleset.version) || ruleset.version < 1) {
    errors.push('ruleset.version must be an integer >= 1');
  }
  dtoErrors(CreateRulesetDto, rulesetContent(ruleset)).forEach((e) =>
    errors.push(`ruleset ${e}`),
  );
  validateRulesetIntegrity(ruleset).forEach((e) => errors.push(`ruleset ${e}`));

  const keys = entries.map((e) => e.key);
  const known = new Set(keys);
  const types = new Set(entries.map((e) => e.type));
  keys
    .filter((k, i) => keys.indexOf(k) !== i)
    .forEach((k) => errors.push(`entry key "${k}" is duplicated`));

  const declaredTypes = [
    ...(ruleset.levels ?? []).map((l) => ['levels', l.type]),
    ...(ruleset.attachments ?? []).flatMap((a) => [
      ['attachments', a.childType],
      ['attachments', a.parentType],
    ]),
    ...(ruleset.collections ?? []).flatMap((c) =>
      (c.from?.types ?? []).map((type) => ['collections', type]),
    ),
  ];
  declaredTypes
    .filter(([, type]) => !types.has(type))
    .forEach(([where, type]) =>
      errors.push(`ruleset ${where} reference unknown entry type "${type}"`),
    );

  entries.forEach((entry) => {
    const prefix = `${entry.type}/${entry.key}`;
    [
      ...dtoErrors(CreateRulesetEntryDto, entry),
      ...validateEntryIntegrity(entry, ruleset),
    ].forEach((e) => errors.push(`${prefix} ${e}`));
    if (entry.parentKey && !known.has(entry.parentKey)) {
      errors.push(`${prefix} parentKey "${entry.parentKey}" is unknown`);
    }
    (entry.grants ?? []).forEach((g) => {
      if (!types.has(g.from.type)) {
        errors.push(
          `${prefix} grant "${g.id}" targets unknown type "${g.from.type}"`,
        );
      }
      if (g.from.parentKey && !known.has(g.from.parentKey)) {
        errors.push(
          `${prefix} grant "${g.id}" parent "${g.from.parentKey}" is unknown`,
        );
      }
      (g.from.keys ?? [])
        .filter((k) => !known.has(k))
        .forEach((k) =>
          errors.push(`${prefix} grant "${g.id}" key "${k}" is unknown`),
        );
    });
  });

  stateReadErrors(ruleset, entries).forEach((e) => errors.push(e));

  return errors;
}

/** Engine state roots whose content is produced by the seed itself (e.g. `state.page.<effect target>`). */
const MIRROR_STATE_KEYS = new Set(['page', 'labels']);

/** String paths of every `var` in a JSON document (expressions are found wherever they are). */
function collectVarPaths(node: unknown, paths: string[] = []): string[] {
  if (Array.isArray(node))
    node.forEach((child) => collectVarPaths(child, paths));
  else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 1 && keys[0] === 'var') {
      const arg = record.var;
      const path = Array.isArray(arg) ? arg[0] : arg;
      if (typeof path === 'string') paths.push(path);
    }
    Object.values(record).forEach((child) => collectVarPaths(child, paths));
  }
  return paths;
}

/**
 * Every `state.<root>` read by the seed is produced by an effect, a counter, a collection or the engine
 * generic state, and `repeat` only exposes `repeat.index`.
 * @see FR-ruleset-character-builder — Engine delivery stages (stage 3)
 */
function stateReadErrors(ruleset: SeedRuleset, entries: SeedEntry[]): string[] {
  const effectRoots = new Set<string>();
  const addTargets = (effects: unknown) =>
    ((effects as { target?: string }[] | undefined) ?? []).forEach((e) => {
      if (typeof e.target === 'string') effectRoots.add(e.target.split('.')[0]);
    });
  entries.forEach((entry) => {
    addTargets(entry.effects);
    (entry.grants ?? []).forEach((g) =>
      addTargets((g as { effects?: unknown }).effects),
    );
  });
  const produced = new Set<string>([
    ...effectRoots,
    ...GENERIC_STATE_KEYS,
    ...(ruleset.counters ?? []).map((c) => c.id),
    ...(ruleset.collections ?? []).map((c) => c.id),
  ]);

  const errors = new Set<string>();
  for (const path of collectVarPaths([ruleset, entries])) {
    const [root, first, second] = path.split('.');
    if (root === 'repeat' && first !== 'index') {
      errors.add(
        `seed reads "${path}" but the engine only provides repeat.index`,
      );
    }
    if (root !== 'state' || !first) continue;
    if (!produced.has(first)) {
      errors.add(`seed reads "state.${first}" but nothing produces it`);
    } else if (
      MIRROR_STATE_KEYS.has(first) &&
      second &&
      !effectRoots.has(second)
    ) {
      errors.add(
        `seed reads "state.${first}.${second}" but no effect produces "${second}"`,
      );
    }
  }
  return [...errors];
}

/** Deterministic JSON: object keys sorted, arrays kept in order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as object)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      )
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Content hash of a seed (ruleset content + entries sorted by type and key). */
export function seedContentHash(seed: RulesetSeed): string {
  const entries = [...seed.entries].sort((a, b) =>
    `${a.type}/${a.key}`.localeCompare(`${b.type}/${b.key}`),
  );
  return createHash('sha256')
    .update(canonical({ ruleset: rulesetContent(seed.ruleset), entries }))
    .digest('hex');
}
