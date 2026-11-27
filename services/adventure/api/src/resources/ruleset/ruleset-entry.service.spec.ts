import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RulesetEntryService } from '@/resources/ruleset/ruleset-entry.service';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import { RulesetEntry } from '@/resources/ruleset/schemas/ruleset-entry.schema';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const RULESET_ID = new Types.ObjectId();

const exec = <T>(value: T) => ({ exec: jest.fn().mockResolvedValue(value) });

function doc<T extends object>(data: T) {
  const d = {
    ...data,
    toObject: jest.fn(() => ({ ...data })),
    set: jest.fn((patch: object) => Object.assign(d, patch)),
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
  };
  return d;
}

const draftRuleset = doc({
  _id: RULESET_ID,
  status: 'draft',
  flow: {
    steps: [
      {
        id: 'race',
        fields: [
          { id: 'race', type: 'entitySelect', source: { type: 'race' } },
        ],
      },
    ],
  },
  formulas: [],
});

const elf = {
  type: 'race',
  key: 'elf',
  label: { en: 'Elf', fr: 'Elfe' },
  effects: [{ op: 'add' as const, target: 'abilities.dex', value: 2 }],
  grants: [
    {
      id: 'elf-subrace',
      kind: 'choose' as const,
      from: { type: 'subrace', parentKey: 'elf' },
      count: 1,
    },
  ],
};

describe('FR-ruleset-character-builder — RulesetEntryService', () => {
  let service: RulesetEntryService;
  let entryModel: Record<string, jest.Mock>;
  let rulesetService: Record<string, jest.Mock>;

  beforeEach(async () => {
    entryModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
    };
    rulesetService = {
      getVisibleOrFail: jest.fn().mockResolvedValue(draftRuleset),
      getDraftOrFail: jest.fn().mockResolvedValue(draftRuleset),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesetEntryService,
        { provide: getModelToken(RulesetEntry.name), useValue: entryModel },
        { provide: RulesetService, useValue: rulesetService },
      ],
    }).compile();

    service = module.get(RulesetEntryService);
  });

  describe('getCatalog', () => {
    const catalogChain = (entries: object[]) => ({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(entries),
    });

    it('nominal: a published catalog is built once, with a stable ETag', async () => {
      rulesetService.getVisibleOrFail.mockResolvedValue({
        _id: RULESET_ID,
        status: 'published',
      });
      entryModel.find.mockReturnValue(catalogChain([elf, { key: 'dwarf' }]));

      const first = await service.getCatalog(RULESET_ID, false);
      const second = await service.getCatalog(RULESET_ID, false);

      expect(first.entries).toHaveLength(2);
      expect(first.etag).toMatch(/^"[\w-]+"$/);
      expect(second).toBe(first);
      expect(entryModel.find).toHaveBeenCalledTimes(1);
      expect(entryModel.find).toHaveBeenCalledWith({ rulesetId: RULESET_ID });
    });

    it('edge: a draft catalog (admin) is read every time and has no ETag', async () => {
      entryModel.find.mockReturnValue(catalogChain([elf]));

      const result = await service.getCatalog(RULESET_ID, true);
      await service.getCatalog(RULESET_ID, true);

      expect(result.etag).toBeNull();
      expect(entryModel.find).toHaveBeenCalledTimes(2);
    });

    it('failure: a non-admin asking a draft catalog gets 404', async () => {
      rulesetService.getVisibleOrFail.mockRejectedValue(
        new NotFoundException('Ruleset not found'),
      );

      await expect(service.getCatalog(RULESET_ID, false)).rejects.toThrow(
        NotFoundException,
      );
      expect(entryModel.find).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('edge: filters by type + parentKey + tags and paginates', async () => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ key: 'high-elf' }]),
      };
      entryModel.find.mockReturnValue(chain);
      entryModel.countDocuments.mockReturnValue(exec(21));

      const result = await service.findAll(
        RULESET_ID,
        {
          type: 'subrace',
          parentKey: 'elf',
          tags: ['srd'],
          page: 3,
          offset: 10,
        },
        false,
      );

      expect(rulesetService.getVisibleOrFail).toHaveBeenCalledWith(
        RULESET_ID,
        false,
      );
      expect(entryModel.find).toHaveBeenCalledWith({
        rulesetId: RULESET_ID,
        type: 'subrace',
        parentKey: 'elf',
        tags: { $all: ['srd'] },
      });
      expect(chain.skip).toHaveBeenCalledWith(20);
      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(result.pagination).toEqual({
        page: 3,
        offset: 10,
        totalItems: 21,
      });
    });

    it('failure: entries of a ruleset not visible to the user answer 404', async () => {
      rulesetService.getVisibleOrFail.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(service.findAll(RULESET_ID, {}, false)).rejects.toThrow(
        NotFoundException,
      );
      expect(entryModel.find).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('nominal: adds a race with an effect and a grant to a draft', async () => {
      entryModel.create.mockImplementation(async (data) => data);

      const result = await service.create(RULESET_ID, elf, USER_ID);

      expect(entryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...elf,
          rulesetId: RULESET_ID,
          createdBy: USER_ID,
        }),
      );
      expect(result.data).toMatchObject({ key: 'elf' });
    });

    it('failure: unresolved parentKey is rejected with 400', async () => {
      entryModel.exists.mockResolvedValue(null);
      await expect(
        service.create(
          RULESET_ID,
          {
            type: 'subrace',
            key: 'high-elf',
            parentKey: 'elf',
            label: { en: 'High elf' },
          },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(entryModel.create).not.toHaveBeenCalled();
    });

    it('failure: an expression referencing an unknown field is rejected', async () => {
      await expect(
        service.create(
          RULESET_ID,
          {
            ...elf,
            effects: [{ op: 'add', target: 'x', when: { var: 'nope' } }],
          },
          USER_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('failure: entries of a published ruleset cannot be created', async () => {
      rulesetService.getDraftOrFail.mockRejectedValue(new ConflictException());
      await expect(service.create(RULESET_ID, elf, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('failure: a duplicate (rulesetId, type, key) answers 409', async () => {
      entryModel.create.mockRejectedValue({ code: 11000 });
      await expect(service.create(RULESET_ID, elf, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('nominal: updates an entry of a draft', async () => {
      const entry = doc({ ...elf, _id: new Types.ObjectId() });
      entryModel.findOne.mockReturnValue(exec(entry));

      await service.update(RULESET_ID, entry._id, { tags: ['srd'] });

      expect(entryModel.findOne).toHaveBeenCalledWith({
        _id: entry._id,
        rulesetId: RULESET_ID,
      });
      expect(entry.save).toHaveBeenCalled();
    });

    it('failure: an entry cannot be its own parent', async () => {
      const entry = doc({ ...elf, _id: new Types.ObjectId() });
      entryModel.findOne.mockReturnValue(exec(entry));
      await expect(
        service.update(RULESET_ID, entry._id, { parentKey: 'elf' }),
      ).rejects.toThrow(ConflictException);
    });

    it('failure: unknown entry answers 404', async () => {
      entryModel.findOne.mockReturnValue(exec(null));
      await expect(
        service.update(RULESET_ID, new Types.ObjectId(), {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('nominal: deletes an entry without children', async () => {
      const entry = doc({ ...elf, _id: new Types.ObjectId() });
      entryModel.findOne.mockReturnValue(exec(entry));
      entryModel.exists.mockResolvedValue(null);

      await service.remove(RULESET_ID, entry._id);

      expect(entry.deleteOne).toHaveBeenCalled();
    });

    it('failure: a parent of other entries cannot be deleted', async () => {
      const entry = doc({ ...elf, _id: new Types.ObjectId() });
      entryModel.findOne.mockReturnValue(exec(entry));
      entryModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(service.remove(RULESET_ID, entry._id)).rejects.toThrow(
        ConflictException,
      );
      expect(entry.deleteOne).not.toHaveBeenCalled();
    });
  });
});
