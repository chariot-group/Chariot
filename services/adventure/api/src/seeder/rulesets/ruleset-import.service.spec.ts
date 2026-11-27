import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  RulesetImportService,
  SEED_IMPORT_USER_ID,
  SeedValidationError,
} from '@/seeder/rulesets/ruleset-import.service';
import {
  RulesetSeed,
  seedContentHash,
} from '@/seeder/rulesets/ruleset-seed.loader';
import { parseArgs } from '@/seeder/rulesets/import-rulesets';

const exec = <T>(value: T) => ({ exec: jest.fn().mockResolvedValue(value) });

const seed = (version = 1): RulesetSeed => ({
  dir: '/seeds/test',
  ruleset: {
    key: 'test-ruleset',
    gameSystem: 'DND_5E',
    version,
    name: { en: 'Test' },
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
            },
          ],
        },
      ],
    },
    formulas: [],
    projection: [],
  } as unknown as RulesetSeed['ruleset'],
  entries: [
    { type: 'race', key: 'elf', label: { en: 'Elf' } },
    {
      type: 'subrace',
      key: 'high-elf',
      parentKey: 'elf',
      label: { en: 'High elf' },
    },
  ],
});

describe('FR-ruleset-character-builder — RulesetImportService', () => {
  let service: RulesetImportService;
  let rulesetModel: Record<string, jest.Mock>;
  let entryModel: Record<string, jest.Mock>;
  let rulesetService: { publish: jest.Mock };
  const draftId = new Types.ObjectId();

  beforeEach(() => {
    rulesetModel = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({ _id: draftId }),
      deleteOne: jest.fn().mockReturnValue(exec({})),
    };
    // findOne(...).exec() for the same version, findOne(...).select().exec() for newer ones
    rulesetModel.findOne.mockImplementation((filter) =>
      typeof filter.version === 'object'
        ? { select: () => exec(null) }
        : exec(null),
    );
    entryModel = {
      insertMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockReturnValue(exec({})),
    };
    rulesetService = { publish: jest.fn().mockResolvedValue({}) };
    service = new RulesetImportService(
      rulesetModel as never,
      entryModel as never,
      rulesetService as never,
    );
  });

  it('nominal: creates the draft with its hash, inserts the entries and publishes', async () => {
    const result = await service.importSeed(seed());

    expect(result).toEqual({
      key: 'test-ruleset',
      version: 1,
      status: 'created',
      entries: 2,
    });
    expect(rulesetModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'test-ruleset',
        version: 1,
        status: 'draft',
        contentHash: seedContentHash(seed()),
        createdBy: SEED_IMPORT_USER_ID,
      }),
    );
    expect(entryModel.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        key: 'elf',
        rulesetId: draftId,
        createdBy: SEED_IMPORT_USER_ID,
      }),
      expect.objectContaining({ key: 'high-elf', rulesetId: draftId }),
    ]);
    expect(rulesetService.publish).toHaveBeenCalledWith(draftId);
  });

  it('edge: a second run with the same content writes nothing', async () => {
    rulesetModel.findOne.mockReturnValueOnce(
      exec({ contentHash: seedContentHash(seed()) }),
    );

    const result = await service.importSeed(seed());

    expect(result.status).toBe('unchanged');
    expect(rulesetModel.create).not.toHaveBeenCalled();
  });

  it('edge: --dry-run validates without writing', async () => {
    const result = await service.importSeed(seed(), { dryRun: true });

    expect(result.status).toBe('validated');
    expect(rulesetModel.create).not.toHaveBeenCalled();
    expect(entryModel.insertMany).not.toHaveBeenCalled();
  });

  it('failure: same version with a different content is refused', async () => {
    rulesetModel.findOne.mockReturnValueOnce(exec({ contentHash: 'other' }));

    await expect(service.importSeed(seed())).rejects.toThrow(ConflictException);
    expect(rulesetModel.create).not.toHaveBeenCalled();
  });

  it('failure: a newer version already in the database is not downgraded', async () => {
    rulesetModel.findOne.mockImplementation((filter) =>
      typeof filter.version === 'object'
        ? { select: () => exec({ version: 3 }) }
        : exec(null),
    );

    await expect(service.importSeed(seed(2))).rejects.toThrow(/v3 is newer/);
    expect(rulesetModel.create).not.toHaveBeenCalled();
  });

  it('failure: an invalid seed writes nothing', async () => {
    const invalid = seed();
    invalid.entries.push({
      type: 'subrace',
      key: 'orphan',
      parentKey: 'nope',
      label: { fr: 'x' },
    });

    await expect(service.importSeed(invalid)).rejects.toThrow(
      SeedValidationError,
    );
    expect(rulesetModel.findOne).not.toHaveBeenCalled();
    expect(rulesetModel.create).not.toHaveBeenCalled();
  });

  it('failure: a failed entry insertion removes the draft and its entries', async () => {
    entryModel.insertMany.mockRejectedValue(new Error('boom'));

    await expect(service.importSeed(seed())).rejects.toThrow('boom');
    expect(entryModel.deleteMany).toHaveBeenCalledWith({ rulesetId: draftId });
    expect(rulesetModel.deleteOne).toHaveBeenCalledWith({ _id: draftId });
    expect(rulesetService.publish).not.toHaveBeenCalled();
  });
});

describe('FR-ruleset-character-builder — import command arguments', () => {
  it('parses --key and --dry-run, defaults to all seeds', () => {
    expect(parseArgs(['--key=dnd5e-2014', '--dry-run'])).toEqual({
      key: 'dnd5e-2014',
      dryRun: true,
    });
    expect(parseArgs([])).toEqual({ key: undefined, dryRun: false });
  });
});
