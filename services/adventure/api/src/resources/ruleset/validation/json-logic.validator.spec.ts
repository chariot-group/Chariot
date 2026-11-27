import { analyzeJsonLogic } from '@/resources/ruleset/validation/json-logic.validator';

describe('FR-ruleset-character-builder — analyzeJsonLogic', () => {
  it('nominal: accepts a standard expression and collects its vars', () => {
    const result = analyzeJsonLogic({
      and: [
        { in: [{ var: 'class' }, ['wizard', 'sorcerer']] },
        { '>=': [{ var: ['state.abilities.int', 10] }, 13] },
      ],
    });

    expect(result.errors).toEqual([]);
    expect(result.vars).toEqual(['class', 'state.abilities.int']);
  });

  it('edge: primitives, arrays and empty var are valid without references', () => {
    expect(analyzeJsonLogic(2)).toEqual({ errors: [], vars: [] });
    expect(analyzeJsonLogic(null)).toEqual({ errors: [], vars: [] });
    expect(analyzeJsonLogic([1, 'a', true])).toEqual({ errors: [], vars: [] });
    expect(analyzeJsonLogic({ var: '' }).vars).toEqual([]);
  });

  it('edge: vars inside map/filter item scopes are not data references', () => {
    const result = analyzeJsonLogic({
      filter: [{ var: 'skills' }, { '==': [{ var: 'ability' }, 'dex'] }],
    });

    expect(result.errors).toEqual([]);
    expect(result.vars).toEqual(['skills']);
  });

  it('edge: missing and missing_some names are collected', () => {
    expect(analyzeJsonLogic({ missing: ['race', 'class'] }).vars).toEqual([
      'race',
      'class',
    ]);
    expect(
      analyzeJsonLogic({ missing_some: [1, ['race', 'background']] }).vars,
    ).toEqual(['race', 'background']);
  });

  it('failure: rejects unknown operators, including log', () => {
    expect(analyzeJsonLogic({ eval: 'process.exit()' }).errors).toEqual([
      '$ uses unknown operator "eval"',
    ]);
    expect(analyzeJsonLogic({ log: 1 }).errors).toHaveLength(1);
  });

  it('failure: rejects objects with several keys and nested unknown operators', () => {
    expect(analyzeJsonLogic({ '==': [1, 1], '!=': [1, 2] }).errors).toEqual([
      '$ must have exactly one operator',
    ]);
    expect(analyzeJsonLogic({ if: [{ foo: [] }, 1, 2] }).errors).toEqual([
      '$.if[0] uses unknown operator "foo"',
    ]);
  });
});
