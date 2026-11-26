import { createHash } from 'crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { GameSystem } from '@/common/constants/game-system.constant';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';
import { CreateRulesetEntryDto } from '@/resources/ruleset/dto/ruleset-entry.dto';
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
  const { key, gameSystem, name, description, flow, formulas, projection } =
    ruleset;
  return { key, gameSystem, name, description, flow, formulas, projection };
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

  return errors;
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
