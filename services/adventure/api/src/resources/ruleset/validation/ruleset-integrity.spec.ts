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

describe('FR-ruleset-character-builder — declarative primitives', () => {
  const declarations: Partial<RulesetLike> = {
    levels: [
      {
        type: 'race',
        expression: {
          var: [{ cat: ['state.races.of.', { var: 'self.key' }] }, 0],
        },
      },
    ],
    attachments: [
      {
        childType: 'racial-trait',
        parentType: 'race',
        when: { '!!': [{ var: 'self.key' }] },
      },
    ],
    counters: [{ id: 'races', fields: ['race'] }],
    collections: [
      {
        id: 'traits',
        from: { types: ['racial-trait'] },
        where: { '!!': [{ var: 'item.label' }] },
        sort: { var: 'item.level' },
        item: {
          name: { var: 'item.label' },
          'uses.max': { var: 'dexModifier' },
        },
      },
      {
        id: 'gear',
        from: { path: 'equipment' },
        item: { name: { var: 'item.key' } },
      },
    ],
  };

  it('nominal: levels, attachments, counters and collections reading self and item are valid', () => {
    expect(validateRulesetIntegrity(ruleset(declarations))).toEqual([]);
  });

  it('edge: entry values reading fields, formulas and self are valid', () => {
    expect(
      validateEntryIntegrity(
        {
          values: {
            multiclassAllowed: { '>=': [{ var: 'dexModifier' }, 1] },
            usesCount: { '+': [1, { var: 'self.level' }] },
          },
        },
        ruleset(),
      ),
    ).toEqual([]);
  });

  it('failure: invalid declarations are rejected', () => {
    expect(
      validateRulesetIntegrity(
        ruleset({
          levels: [
            { type: 'race', expression: 1 },
            { type: 'race', expression: { log: 1 } },
          ],
          attachments: [{ childType: 'race', parentType: 'race' }],
          counters: [
            { id: 'entries', fields: ['race'] },
            { id: 'bad', fields: ['nope', 'dexMod'] },
          ],
          collections: [
            { id: 'bad', from: {}, item: {} },
            {
              id: 'both',
              from: { types: ['x'], path: 'a..b' },
              item: { 'a..b': { var: 'unknownRoot' } },
            },
          ],
        }),
      ),
    ).toEqual([
      'levels type "race" is duplicated',
      'levels[1].expression $ uses unknown operator "log"',
      'attachments[0] childType and parentType must differ',
      'counter/collection id "bad" is duplicated',
      'counter/collection id "entries" is reserved by the engine',
      'counters[1].fields references unknown field "nope"',
      'counters[1].fields "dexMod" must be an entitySelect or multiSelect field',
      'collections[0].from must define either types or path',
      'collections[0].item must define at least one target',
      'collections[1].from must define either types or path',
      'collections[1].from.path "a..b" is not a valid path',
      'collections[1].item target "a..b" is not a valid path',
      'collections[1].item.a..b references unknown variable "unknownRoot"',
    ]);
  });

  it('failure: entry values with a bad name or an unknown operator are rejected', () => {
    expect(
      validateEntryIntegrity(
        { values: { 'bad name': 1, ok: { log: 'x' } } },
        ruleset(),
      ),
    ).toEqual([
      'values "bad name" is not a valid identifier',
      'values.ok $ uses unknown operator "log"',
    ]);
  });
});

describe('FR-ruleset-character-builder — spellcasting (stage 4)', () => {
  const withField = (field: Record<string, unknown>): RulesetLike =>
    ruleset({
      flow: {
        steps: [
          {
            id: 'spells',
            fields: [
              { id: 'class', type: 'entitySelect', source: { type: 'class' } },
              field as never,
            ],
          },
        ],
      },
      projection: [],
    });

  it('nominal: a spellSelect groups its spells by a field and reads ruleset data', () => {
    expect(
      validateRulesetIntegrity(
        withField({
          id: 'spells',
          type: 'spellSelect',
          spellGroup: { var: 'class' },
          count: { var: 'ruleset.data.spellsByLevel.0' },
        }),
      ),
    ).toEqual([]);
  });

  it('failure: spellGroup on another field type or with an unknown variable is rejected', () => {
    expect(
      validateRulesetIntegrity(
        withField({
          id: 'name',
          type: 'text',
          spellGroup: { var: 'unknownField' },
        }),
      ),
    ).toEqual([
      'flow.steps[0].fields[1].spellGroup references unknown variable "unknownField"',
      'flow.steps[0].fields[1].spellGroup is only allowed for spellSelect',
    ]);
  });
});

describe('FR-ruleset-character-builder — grant label and default', () => {
  it('nominal: a grant default listing keys or reading a field is valid', () => {
    expect(
      validateEntryIntegrity(
        {
          grants: [
            { id: 'languages', count: 1, default: ['common'] },
            { id: 'skills', count: 2, default: { var: 'race' } },
          ],
        },
        ruleset(),
      ),
    ).toEqual([]);
  });

  it('failure: a grant default reading an unknown variable is rejected', () => {
    expect(
      validateEntryIntegrity(
        { grants: [{ id: 'skills', count: 2, default: { var: 'nope' } }] },
        ruleset(),
      ),
    ).toEqual(['grants[0].default references unknown variable "nope"']);
  });
});

describe('FR-ruleset-character-builder — step cards', () => {
  const withCards = (
    cards: { id: string; fields: string[] }[],
  ): RulesetLike => {
    const base = ruleset();
    const [first, ...rest] = base.flow?.steps ?? [];
    return { ...base, flow: { steps: [{ ...first, cards }, ...rest] } };
  };

  it('nominal: a card grouping fields of its step is valid', () => {
    expect(
      validateRulesetIntegrity(
        withCards([{ id: 'origin', fields: ['race', 'raceChoices'] }]),
      ),
    ).toEqual([]);
  });

  it('edge: a step without cards keeps every field on its own', () => {
    expect(validateRulesetIntegrity(withCards([]))).toEqual([]);
  });

  it('failure: duplicated cards, a field in two cards or outside the step are rejected', () => {
    expect(
      validateRulesetIntegrity(
        withCards([
          { id: 'origin', fields: ['race'] },
          { id: 'origin', fields: ['race', 'scores'] },
        ]),
      ),
    ).toEqual([
      'flow.steps[0].cards id "origin" is duplicated',
      'flow.steps[0].cards field "race" is duplicated',
      'flow.steps[0].cards[1] references field "scores" outside the step',
    ]);
  });
});
