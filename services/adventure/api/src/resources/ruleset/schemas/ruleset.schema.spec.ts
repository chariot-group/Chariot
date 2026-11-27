import mongoose from 'mongoose';
import { RulesetSchema } from '@/resources/ruleset/schemas/ruleset.schema';
import { RulesetEntrySchema } from '@/resources/ruleset/schemas/ruleset-entry.schema';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const RulesetModel = mongoose.model('RulesetSchemaSpec', RulesetSchema);
const EntryModel = mongoose.model('RulesetEntrySchemaSpec', RulesetEntrySchema);

describe('FR-ruleset-character-builder — Mongoose schemas', () => {
  it('nominal: a ruleset keeps its flow, field "type"/"default" and JSON Logic', async () => {
    const doc = new RulesetModel({
      key: 'dnd5e-2014',
      gameSystem: 'DND_5E',
      version: 1,
      name: { en: 'D&D 5e' },
      createdBy: USER_ID,
      flow: {
        steps: [
          {
            id: 'race',
            order: 1,
            title: { en: 'Race' },
            breadcrumb: { en: 'Race' },
            modes: ['creation'],
            fields: [
              {
                id: 'race',
                type: 'entitySelect',
                label: { en: 'Race' },
                source: { type: 'race' },
                default: 'human',
                visibleWhen: { '==': [{ var: 'context.mode' }, 'creation'] },
              },
            ],
          },
        ],
      },
    });

    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.status).toBe('draft');
    const field = doc.flow.steps[0].fields[0];
    expect(field.type).toBe('entitySelect');
    expect(field.default).toBe('human');
    expect(field.visibleWhen).toEqual({
      '==': [{ var: 'context.mode' }, 'creation'],
    });
  });

  it('edge: declares the uniqueness indexes', () => {
    expect(RulesetSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ key: 1, version: 1 }, expect.objectContaining({ unique: true })],
        [
          { key: 1 },
          expect.objectContaining({
            unique: true,
            partialFilterExpression: { status: 'published' },
          }),
        ],
      ]),
    );
    expect(RulesetEntrySchema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { rulesetId: 1, type: 1, key: 1 },
          expect.objectContaining({ unique: true }),
        ],
      ]),
    );
  });

  it('failure: rejects an unknown status and effect op', async () => {
    const ruleset = new RulesetModel({
      key: 'k',
      gameSystem: 'DND_5E',
      version: 1,
      status: 'live',
      name: { en: 'K' },
      createdBy: USER_ID,
    });
    await expect(ruleset.validate()).rejects.toMatchObject({
      errors: { status: expect.anything() },
    });

    const entry = new EntryModel({
      rulesetId: new mongoose.Types.ObjectId(),
      type: 'race',
      key: 'elf',
      label: { en: 'Elf' },
      createdBy: USER_ID,
      effects: [{ op: 'multiply', target: 'abilities.dex', value: 2 }],
    });
    await expect(entry.validate()).rejects.toMatchObject({
      errors: { 'effects.0.op': expect.anything() },
    });
  });
});
