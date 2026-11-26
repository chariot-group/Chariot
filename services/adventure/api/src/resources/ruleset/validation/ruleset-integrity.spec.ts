import {
  RulesetLike,
  validateEntryIntegrity,
  validateRulesetIntegrity,
} from '@/resources/ruleset/validation/ruleset-integrity';

function ruleset(overrides: Partial<RulesetLike> = {}): RulesetLike {
  return {
    flow: {
      steps: [
        {
          id: 'race',
          fields: [
            { id: 'race', type: 'entitySelect', source: { type: 'race' } },
            { id: 'raceChoices', type: 'grantedChoices', from: 'race' },
          ],
        },
        {
          id: 'abilities',
          visibleWhen: { '!!': [{ var: 'race' }] },
          fields: [
            {
              id: 'scores',
              type: 'abilityAllocation',
              methods: ['pointBuy'],
            },
            {
              id: 'dexMod',
              type: 'computed',
              formula: { var: 'dexModifier' },
            },
          ],
        },
        {
          id: 'level-up',
          repeat: { from: 2, to: { var: 'context.targetLevel' } },
          fields: [
            {
              id: 'skills',
              type: 'multiSelect',
              source: { type: 'skill' },
              count: 2,
              visibleWhen: { '==': [{ var: 'repeat.index' }, 4] },
            },
          ],
        },
      ],
    },
    formulas: [
      {
        id: 'dexModifier',
        expression: {
          '-': [{ '/': [{ var: 'state.abilities.dex' }, 2] }, 5],
        },
      },
    ],
    projection: [
      {
        source: { var: 'state.abilities.dex' },
        target: 'stats.abilityScores.dex',
      },
    ],
    ...overrides,
  };
}

describe('FR-ruleset-character-builder — validateRulesetIntegrity', () => {
  it('nominal: a consistent ruleset has no errors', () => {
    expect(validateRulesetIntegrity(ruleset())).toEqual([]);
  });

  it('edge: an empty ruleset is valid (draft being built)', () => {
    expect(validateRulesetIntegrity({})).toEqual([]);
  });

  it('failure: duplicate step ids and field/formula ids are rejected', () => {
    const errors = validateRulesetIntegrity(
      ruleset({
        formulas: [
          { id: 'race', expression: 1 },
          { id: 'dexModifier', expression: 1 },
        ],
        flow: {
          steps: [
            { id: 'race', fields: [] },
            { id: 'race', fields: [] },
          ],
        },
      }),
    );
    expect(errors).toContain('flow.steps id "race" is duplicated');
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining('is duplicated')]),
    );
  });

  it('failure: unresolved variable references are rejected', () => {
    const errors = validateRulesetIntegrity(
      ruleset({
        formulas: [{ id: 'hp', expression: { var: 'constitution' } }],
      }),
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        'formulas[0].expression references unknown variable "constitution"',
        // dexMod still points to the removed dexModifier formula
        'flow.steps[1].fields[1].formula references unknown variable "dexModifier"',
      ]),
    );
  });

  it('failure: grantedChoices must reference an existing select field', () => {
    const base = ruleset();
    base.flow.steps[0].fields[1].from = 'unknown';
    expect(validateRulesetIntegrity(base)).toContain(
      'flow.steps[0].fields[1].from references unknown field "unknown"',
    );
    base.flow.steps[0].fields[1].from = 'scores';
    expect(validateRulesetIntegrity(base)).toContain(
      'flow.steps[0].fields[1].from must reference an entitySelect or multiSelect field',
    );
  });

  it('failure: type-specific config is required', () => {
    const errors = validateRulesetIntegrity({
      flow: {
        steps: [
          {
            id: 's',
            fields: [
              { id: 'a', type: 'entitySelect' },
              { id: 'b', type: 'multiSelect', source: { type: 'skill' } },
              { id: 'c', type: 'computed' },
              { id: 'd', type: 'abilityAllocation' },
              { id: 'e', type: 'grantedChoices' },
            ],
          },
        ],
      },
    });
    expect(errors).toEqual([
      'flow.steps[0].fields[0].source is required for entitySelect',
      'flow.steps[0].fields[1].count is required for multiSelect',
      'flow.steps[0].fields[2].formula is required for computed',
      'flow.steps[0].fields[3].methods is required for abilityAllocation',
      'flow.steps[0].fields[4].from is required for grantedChoices',
    ]);
  });

  it('failure: formula reference cycles and reserved ids are rejected', () => {
    const errors = validateRulesetIntegrity({
      formulas: [
        { id: 'a', expression: { var: 'b' } },
        { id: 'b', expression: { '+': [{ var: 'a' }, 1] } },
        { id: 'state', expression: 1 },
      ],
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        'formulas "a" is part of a reference cycle',
        'formulas "b" is part of a reference cycle',
        'field/formula id "state" is reserved',
      ]),
    );
  });
});

describe('FR-ruleset-character-builder — validateEntryIntegrity', () => {
  it('nominal: effects and grants referencing ruleset fields are valid', () => {
    expect(
      validateEntryIntegrity(
        {
          effects: [{ target: 'abilities.dex', when: { var: 'race' } }],
          grants: [{ id: 'elf-subrace', count: 1 }],
        },
        ruleset(),
      ),
    ).toEqual([]);
  });

  it('failure: unknown variables and duplicate grant ids are rejected', () => {
    expect(
      validateEntryIntegrity(
        {
          effects: [{ target: 'x', when: { var: 'unknownField' } }],
          grants: [
            { id: 'g', count: 1 },
            { id: 'g', count: { var: 'nope' } },
          ],
        },
        ruleset(),
      ),
    ).toEqual([
      'effects[0].when references unknown variable "unknownField"',
      'grants id "g" is duplicated',
      'grants[1].count references unknown variable "nope"',
    ]);
  });
});

describe('FR-ruleset-character-builder — spellSelect', () => {
  it('nominal: a spellSelect filtered by a field and a formula is valid', () => {
    expect(
      validateRulesetIntegrity({
        formulas: [{ id: 'maxSpellLevel', expression: 1 }],
        flow: {
          steps: [
            {
              id: 'spells',
              fields: [
                {
                  id: 'class',
                  type: 'entitySelect',
                  source: { type: 'class' },
                },
                {
                  id: 'spells',
                  type: 'spellSelect',
                  count: 2,
                  spellFilter: {
                    className: { var: 'class' },
                    minLevel: 1,
                    maxLevel: { var: 'maxSpellLevel' },
                  },
                },
              ],
            },
          ],
        },
      }),
    ).toEqual([]);
  });

  it('failure: an unknown variable in spellFilter is rejected', () => {
    expect(
      validateRulesetIntegrity({
        flow: {
          steps: [
            {
              id: 's',
              fields: [
                {
                  id: 'spells',
                  type: 'spellSelect',
                  spellFilter: { maxLevel: { var: 'nope' } },
                },
              ],
            },
          ],
        },
      }),
    ).toEqual([
      'flow.steps[0].fields[0].spellFilter.maxLevel references unknown variable "nope"',
    ]);
  });
});
