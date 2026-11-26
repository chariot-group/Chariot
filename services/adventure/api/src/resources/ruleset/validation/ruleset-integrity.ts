import { RESERVED_VAR_ROOTS } from '@/resources/ruleset/constants/ruleset.constant';
import {
  analyzeJsonLogic,
  varRoot,
} from '@/resources/ruleset/validation/json-logic.validator';

/**
 * Cross-field integrity of a ruleset and its entries (what DTO validation cannot see).
 * Every function returns error messages formatted `<path> <reason>`; empty when valid.
 * @see FR-ruleset-character-builder — Integrity
 */

type Expression = unknown;

type FieldLike = {
  id: string;
  type: string;
  source?: { type: string; parentKey?: string };
  count?: Expression;
  from?: string;
  methods?: string[];
  spellFilter?: {
    className?: Expression;
    minLevel?: Expression;
    maxLevel?: Expression;
  };
  formula?: Expression;
  visibleWhen?: Expression;
  requiredWhen?: Expression;
  default?: Expression;
  optionsFilter?: Expression;
  validation?: Expression;
};

type StepLike = {
  id: string;
  visibleWhen?: Expression;
  repeat?: { from: Expression; to: Expression };
  fields?: FieldLike[];
};

export type RulesetLike = {
  flow?: { steps?: StepLike[] };
  formulas?: { id: string; expression: Expression }[];
  projection?: { source: Expression; target: string }[];
};

type EffectLike = { target: string; when?: Expression };
type GrantLike = {
  id: string;
  count: Expression;
  when?: Expression;
  effects?: EffectLike[];
};

export type RulesetEntryLike = {
  effects?: EffectLike[];
  grants?: GrantLike[];
};

const FIELD_EXPRESSION_KEYS = [
  'count',
  'formula',
  'visibleWhen',
  'requiredWhen',
  'default',
  'optionsFilter',
  'validation',
] as const;

const SELECT_TYPES = ['entitySelect', 'multiSelect'];

/** Ids an expression may reference: field ids, formula ids and reserved roots. */
export function knownVarRoots(ruleset: RulesetLike): Set<string> {
  const roots = new Set<string>(RESERVED_VAR_ROOTS);
  for (const step of ruleset.flow?.steps ?? []) {
    for (const field of step.fields ?? []) roots.add(field.id);
  }
  for (const formula of ruleset.formulas ?? []) roots.add(formula.id);
  return roots;
}

function checkExpression(
  expression: Expression,
  path: string,
  roots: Set<string>,
  errors: string[],
): string[] {
  if (expression === undefined) return [];
  const { errors: syntax, vars } = analyzeJsonLogic(expression);
  syntax.forEach((e) => errors.push(`${path} ${e}`));
  const unresolved = vars.filter((v) => !roots.has(varRoot(v)));
  unresolved.forEach((v) =>
    errors.push(`${path} references unknown variable "${v}"`),
  );
  return vars;
}

function pushDuplicates(ids: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${label} "${id}" is duplicated`);
    seen.add(id);
  }
}

/** Formula ids involved in a reference cycle (formula → formula). */
function findFormulaCycles(deps: Map<string, string[]>): string[] {
  const state = new Map<string, 'visiting' | 'done'>();
  const cyclic = new Set<string>();

  const visit = (id: string, stack: string[]) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      stack.slice(stack.indexOf(id)).forEach((c) => cyclic.add(c));
      return;
    }
    state.set(id, 'visiting');
    for (const dep of deps.get(id) ?? []) visit(dep, [...stack, id]);
    state.set(id, 'done');
  };

  [...deps.keys()].forEach((id) => visit(id, []));
  return [...cyclic];
}

export function validateRulesetIntegrity(ruleset: RulesetLike): string[] {
  const errors: string[] = [];
  const steps = ruleset.flow?.steps ?? [];
  const formulas = ruleset.formulas ?? [];
  const fields = steps.flatMap((s) => s.fields ?? []);
  const roots = knownVarRoots(ruleset);
  const fieldsById = new Map(fields.map((f) => [f.id, f]));

  pushDuplicates(
    steps.map((s) => s.id),
    'flow.steps id',
    errors,
  );
  pushDuplicates(
    [...fields.map((f) => f.id), ...formulas.map((f) => f.id)],
    'field/formula id',
    errors,
  );
  RESERVED_VAR_ROOTS.forEach((reserved) => {
    if (fieldsById.has(reserved) || formulas.some((f) => f.id === reserved)) {
      errors.push(`field/formula id "${reserved}" is reserved`);
    }
  });

  steps.forEach((step, si) => {
    const stepPath = `flow.steps[${si}]`;
    checkExpression(step.visibleWhen, `${stepPath}.visibleWhen`, roots, errors);
    if (step.repeat) {
      checkExpression(
        step.repeat.from,
        `${stepPath}.repeat.from`,
        roots,
        errors,
      );
      checkExpression(step.repeat.to, `${stepPath}.repeat.to`, roots, errors);
    }

    (step.fields ?? []).forEach((field, fi) => {
      const path = `${stepPath}.fields[${fi}]`;
      FIELD_EXPRESSION_KEYS.forEach((key) =>
        checkExpression(field[key], `${path}.${key}`, roots, errors),
      );
      (['className', 'minLevel', 'maxLevel'] as const).forEach((key) =>
        checkExpression(
          field.spellFilter?.[key],
          `${path}.spellFilter.${key}`,
          roots,
          errors,
        ),
      );

      if (SELECT_TYPES.includes(field.type) && !field.source) {
        errors.push(`${path}.source is required for ${field.type}`);
      }
      if (field.type === 'multiSelect' && field.count === undefined) {
        errors.push(`${path}.count is required for multiSelect`);
      }
      if (field.type === 'computed' && field.formula === undefined) {
        errors.push(`${path}.formula is required for computed`);
      }
      if (field.type === 'abilityAllocation' && !field.methods?.length) {
        errors.push(`${path}.methods is required for abilityAllocation`);
      }
      if (field.type === 'grantedChoices') {
        const target = field.from ? fieldsById.get(field.from) : undefined;
        if (!field.from) {
          errors.push(`${path}.from is required for grantedChoices`);
        } else if (!target) {
          errors.push(`${path}.from references unknown field "${field.from}"`);
        } else if (!SELECT_TYPES.includes(target.type)) {
          errors.push(
            `${path}.from must reference an entitySelect or multiSelect field`,
          );
        }
      }
    });
  });

  const formulaIds = new Set(formulas.map((f) => f.id));
  const deps = new Map<string, string[]>();
  formulas.forEach((formula, i) => {
    const vars = checkExpression(
      formula.expression,
      `formulas[${i}].expression`,
      roots,
      errors,
    );
    deps.set(
      formula.id,
      vars.map(varRoot).filter((root) => formulaIds.has(root)),
    );
  });
  findFormulaCycles(deps).forEach((id) =>
    errors.push(`formulas "${id}" is part of a reference cycle`),
  );

  (ruleset.projection ?? []).forEach((p, i) =>
    checkExpression(p.source, `projection[${i}].source`, roots, errors),
  );

  return errors;
}

/** Expressions of an entry may reference the fields and formulas of its ruleset. */
export function validateEntryIntegrity(
  entry: RulesetEntryLike,
  ruleset: RulesetLike,
): string[] {
  const errors: string[] = [];
  const roots = knownVarRoots(ruleset);

  (entry.effects ?? []).forEach((effect, i) =>
    checkExpression(effect.when, `effects[${i}].when`, roots, errors),
  );
  pushDuplicates(
    (entry.grants ?? []).map((g) => g.id),
    'grants id',
    errors,
  );
  (entry.grants ?? []).forEach((grant, i) => {
    checkExpression(grant.count, `grants[${i}].count`, roots, errors);
    checkExpression(grant.when, `grants[${i}].when`, roots, errors);
    (grant.effects ?? []).forEach((effect, j) =>
      checkExpression(
        effect.when,
        `grants[${i}].effects[${j}].when`,
        roots,
        errors,
      ),
    );
  });

  return errors;
}
