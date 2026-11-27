import {
  JSON_LOGIC_OPERATORS,
  JSON_LOGIC_SCOPED_OPERATORS,
} from '@/resources/ruleset/constants/ruleset.constant';

/** @see FR-ruleset-character-builder — Logic and expressions */

export type JsonLogicAnalysis = {
  /** Syntax errors, prefixed with the path inside the expression. */
  errors: string[];
  /** Data paths read by the expression (`var`, `missing`, `missing_some`), outside item scopes. */
  vars: string[];
};

const OPERATORS = new Set<string>(JSON_LOGIC_OPERATORS);
const SCOPED_OPERATORS = new Set<string>(JSON_LOGIC_SCOPED_OPERATORS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function asArgs(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Checks that a value is a valid JSON Logic expression made only of standard operators,
 * and collects the data paths it reads. Primitives and arrays of expressions are valid.
 */
export function analyzeJsonLogic(expression: unknown): JsonLogicAnalysis {
  const errors: string[] = [];
  const vars: string[] = [];

  const visit = (node: unknown, path: string, scoped: boolean): void => {
    if (
      node === null ||
      ['string', 'number', 'boolean'].includes(typeof node)
    ) {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => visit(child, `${path}[${i}]`, scoped));
      return;
    }
    if (!isPlainObject(node)) {
      errors.push(`${path} is not a JSON value`);
      return;
    }

    const keys = Object.keys(node);
    if (keys.length !== 1) {
      errors.push(`${path} must have exactly one operator`);
      return;
    }

    const [op] = keys;
    if (!OPERATORS.has(op)) {
      errors.push(`${path} uses unknown operator "${op}"`);
      return;
    }

    const raw = node[op];
    const args = asArgs(raw);
    const opPath = `${path}.${op}`;

    if (op === 'var') {
      const [name, fallback] = args;
      if (typeof name === 'string') {
        if (!scoped && name !== '') vars.push(name);
      } else if (typeof name !== 'number') {
        visit(name, `${opPath}[0]`, scoped);
      }
      if (args.length > 1) visit(fallback, `${opPath}[1]`, scoped);
      return;
    }

    if (op === 'missing' || op === 'missing_some') {
      const names = op === 'missing_some' ? asArgs(args[1]) : args;
      if (op === 'missing_some') visit(args[0], `${opPath}[0]`, scoped);
      names.forEach((name, i) => {
        if (typeof name === 'string') {
          if (!scoped) vars.push(name);
        } else {
          visit(name, `${opPath}[${i}]`, scoped);
        }
      });
      return;
    }

    if (SCOPED_OPERATORS.has(op)) {
      // Arg 0 reads the builder data; the following args are evaluated per item.
      args.forEach((child, i) =>
        visit(child, `${opPath}[${i}]`, scoped || i > 0),
      );
      return;
    }

    args.forEach((child, i) => visit(child, `${opPath}[${i}]`, scoped));
  };

  visit(expression, '$', false);
  return { errors, vars };
}

/** Root segment of a data path: `abilities.dex` → `abilities`. */
export function varRoot(path: string): string {
  return path.split('.')[0];
}
