import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { translatedLabelErrors } from '@/resources/ruleset/validation/validators.decorator';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';
import { CreateRulesetEntryDto } from '@/resources/ruleset/dto/ruleset-entry.dto';

async function errorsOf<T extends object>(cls: new () => T, plain: object) {
  const errors = await validate(plainToInstance(cls, plain), {
    whitelist: true,
  });
  return JSON.stringify(errors);
}

describe('FR-ruleset-character-builder — translated labels', () => {
  it('nominal: accepts en only and en + fr + es', () => {
    expect(translatedLabelErrors({ en: 'Elf' })).toEqual([]);
    expect(
      translatedLabelErrors({ en: 'Elf', fr: 'Elfe', es: 'Elfo' }),
    ).toEqual([]);
  });

  it('failure: rejects a label without en', () => {
    expect(translatedLabelErrors({ fr: 'Elfe' })).toEqual([
      'must define the "en" locale',
    ]);
  });

  it('failure: rejects unknown locales and empty texts', () => {
    expect(translatedLabelErrors({ en: 'Elf', de: 'Elf' })[0]).toContain(
      'unknown locale "de"',
    );
    expect(translatedLabelErrors({ en: ' ' })[0]).toContain('non-empty');
    expect(translatedLabelErrors('Elf')).toEqual([
      'must be an object keyed by locale',
    ]);
  });
});

describe('FR-ruleset-character-builder — DTO validation', () => {
  const validRuleset = {
    key: 'dnd5e-2014',
    gameSystem: 'DND_5E',
    name: { en: 'D&D 5e (2014)', fr: 'D&D 5e (2014)' },
    flow: {
      steps: [
        {
          id: 'race',
          order: 1,
          title: { en: 'Choose your race' },
          breadcrumb: { en: 'Race' },
          modes: ['creation'],
          fields: [
            {
              id: 'race',
              type: 'entitySelect',
              label: { en: 'Race' },
              source: { type: 'race' },
              visibleWhen: { '!!': [true] },
            },
          ],
        },
      ],
    },
  };

  it('nominal: accepts a valid ruleset', async () => {
    expect(await errorsOf(CreateRulesetDto, validRuleset)).toBe('[]');
  });

  it('failure: rejects a non kebab-case key and an unknown game system', async () => {
    const errors = await errorsOf(CreateRulesetDto, {
      ...validRuleset,
      key: 'DnD 5e',
      gameSystem: 'PATHFINDER',
    });
    expect(errors).toContain('key must be kebab-case');
    expect(errors).toContain('gameSystem');
  });

  it('failure: rejects an invalid JSON Logic expression in a nested field', async () => {
    const plain = structuredClone(validRuleset);
    plain.flow.steps[0].fields[0].visibleWhen = { exec: [] } as never;
    expect(await errorsOf(CreateRulesetDto, plain)).toContain(
      'unknown operator \\"exec\\"',
    );
  });

  it('failure: rejects an entry label without en', async () => {
    const errors = await errorsOf(CreateRulesetEntryDto, {
      type: 'race',
      key: 'elf',
      label: { fr: 'Elfe' },
    });
    expect(errors).toContain('must define the \\"en\\" locale');
  });
});
