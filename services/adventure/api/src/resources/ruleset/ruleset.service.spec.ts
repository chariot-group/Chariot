import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RulesetService } from '@/resources/ruleset/ruleset.service';
import { Ruleset } from '@/resources/ruleset/schemas/ruleset.schema';
import { RulesetEntry } from '@/resources/ruleset/schemas/ruleset-entry.schema';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

const exec = <T>(value: T) => ({ exec: jest.fn().mockResolvedValue(value) });

/** Minimal Mongoose-like document. */
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

const createDto = {
  key: 'dnd5e-2014',
  gameSystem: 'DND_5E' as const,
  name: { en: 'D&D 5e (2014)' },
  flow: {
    steps: [
      {
        id: 'race',
        order: 1,
        title: { en: 'Race' },
        breadcrumb: { en: 'Race' },
        modes: ['creation' as const],
        fields: [
          {
            id: 'race',
            type: 'entitySelect' as const,
            label: { en: 'Race' },
            source: { type: 'race' },
          },
        ],
      },
    ],
  },
};

describe('FR-ruleset-character-builder — RulesetService', () => {
  let service: RulesetService;
  let rulesetModel: Record<string, jest.Mock>;
  let entryModel: Record<string, jest.Mock>;

  beforeEach(async () => {
    rulesetModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockReturnValue(exec({})),
    };
    entryModel = {
      find: jest.fn().mockReturnValue(exec([])),
      deleteMany: jest.fn().mockReturnValue(exec({})),
      insertMany: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesetService,
        { provide: getModelToken(Ruleset.name), useValue: rulesetModel },
        { provide: getModelToken(RulesetEntry.name), useValue: entryModel },
      ],
    }).compile();

    service = module.get(RulesetService);
  });

  describe('read', () => {
    it('nominal: non-admins only list published rulesets, without flow', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      rulesetModel.find.mockReturnValue(chain);

      await service.findAll({ gameSystem: 'DND_5E' }, false);

      expect(rulesetModel.find).toHaveBeenCalledWith({
        status: 'published',
        gameSystem: 'DND_5E',
      });
      expect(chain.select).toHaveBeenCalledWith('-flow -formulas -projection');
    });

    it('edge: admins list every status', async () => {
      rulesetModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      await service.findAll({}, true);
      expect(rulesetModel.find).toHaveBeenCalledWith({});
    });

    it('nominal: reads the published version by key', async () => {
      const published = doc({ key: 'dnd5e-2014', status: 'published' });
      rulesetModel.findOne.mockReturnValue(exec(published));

      const result = await service.findPublishedByKey('dnd5e-2014');

      expect(rulesetModel.findOne).toHaveBeenCalledWith({
        key: 'dnd5e-2014',
        status: 'published',
      });
      expect(result.data).toBe(published);
    });

    it('failure: a non-admin reading a draft gets 404, an admin can read it', async () => {
      const id = new Types.ObjectId();
      rulesetModel.findById.mockReturnValue(exec(doc({ status: 'draft' })));

      await expect(service.findById(id, false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(id, true)).resolves.toBeDefined();
    });
  });

  describe('create', () => {
    it('nominal: creates version 1 as a draft', async () => {
      rulesetModel.exists.mockResolvedValue(null);
      rulesetModel.create.mockImplementation(async (data) => data);

      const result = await service.create(createDto, USER_ID);

      expect(rulesetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'dnd5e-2014',
          version: 1,
          status: 'draft',
          createdBy: USER_ID,
        }),
      );
      expect(result.data).toMatchObject({ version: 1 });
    });

    it('failure: an existing key is rejected with 409', async () => {
      rulesetModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
      await expect(service.create(createDto, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('failure: integrity errors are rejected with 400', async () => {
      rulesetModel.exists.mockResolvedValue(null);
      const invalid = {
        ...createDto,
        formulas: [{ id: 'hp', expression: { var: 'unknown' } }],
      };
      await expect(service.create(invalid, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(rulesetModel.create).not.toHaveBeenCalled();
    });

    it('failure: a Mongo duplicate key error becomes 409', async () => {
      rulesetModel.exists.mockResolvedValue(null);
      rulesetModel.create.mockRejectedValue({ code: 11000 });
      await expect(service.create(createDto, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('nominal: updates a draft', async () => {
      const draft = doc({ ...createDto, status: 'draft' });
      rulesetModel.findById.mockReturnValue(exec(draft));

      await service.update(new Types.ObjectId(), { name: { en: 'Renamed' } });

      expect(draft.set).toHaveBeenCalledWith({ name: { en: 'Renamed' } });
      expect(draft.save).toHaveBeenCalled();
    });

    it('failure: a published ruleset cannot be updated in place', async () => {
      const published = doc({ ...createDto, status: 'published' });
      rulesetModel.findById.mockReturnValue(exec(published));

      await expect(
        service.update(new Types.ObjectId(), { name: { en: 'X' } }),
      ).rejects.toThrow(ConflictException);
      expect(published.save).not.toHaveBeenCalled();
    });

    it('failure: removing a field still referenced is rejected', async () => {
      const draft = doc({
        ...createDto,
        status: 'draft',
        formulas: [{ id: 'f', expression: { var: 'race' } }],
      });
      rulesetModel.findById.mockReturnValue(exec(draft));

      await expect(
        service.update(new Types.ObjectId(), { flow: { steps: [] } }),
      ).rejects.toThrow(BadRequestException);
      expect(draft.save).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('nominal: archives the published version of the key then publishes the draft', async () => {
      const draft = doc({
        ...createDto,
        _id: new Types.ObjectId(),
        version: 2,
        status: 'draft',
      });
      rulesetModel.findById.mockReturnValue(exec(draft));

      await service.publish(draft._id);

      expect(rulesetModel.updateMany).toHaveBeenCalledWith(
        { key: 'dnd5e-2014', status: 'published' },
        { $set: { status: 'archived' } },
      );
      expect(draft.status).toBe('published');
      expect(draft.publishedAt).toBeInstanceOf(Date);
      expect(draft.save).toHaveBeenCalled();
    });

    it('failure: an entry with an unresolved parentKey blocks publication', async () => {
      const draft = doc({
        ...createDto,
        _id: new Types.ObjectId(),
        status: 'draft',
      });
      rulesetModel.findById.mockReturnValue(exec(draft));
      entryModel.find.mockReturnValue(
        exec([doc({ type: 'subrace', key: 'high-elf', parentKey: 'elf' })]),
      );

      await expect(service.publish(draft._id)).rejects.toThrow(
        BadRequestException,
      );
      expect(rulesetModel.updateMany).not.toHaveBeenCalled();
      expect(draft.status).toBe('draft');
    });

    it('failure: an already published ruleset cannot be published again', async () => {
      rulesetModel.findById.mockReturnValue(
        exec(doc({ ...createDto, status: 'published' })),
      );
      await expect(service.publish(new Types.ObjectId())).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('archive', () => {
    it('nominal: archives a published ruleset', async () => {
      const published = doc({ status: 'published' });
      rulesetModel.findById.mockReturnValue(exec(published));
      await service.archive(new Types.ObjectId());
      expect(published.status).toBe('archived');
    });

    it('failure: a draft cannot be archived', async () => {
      rulesetModel.findById.mockReturnValue(exec(doc({ status: 'draft' })));
      await expect(service.archive(new Types.ObjectId())).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('createVersion', () => {
    it('nominal: copies the ruleset and its entries into the next draft version', async () => {
      const sourceId = new Types.ObjectId();
      const draftId = new Types.ObjectId();
      const source = doc({
        ...createDto,
        _id: sourceId,
        version: 1,
        status: 'published',
        formulas: [],
        projection: [],
      });
      rulesetModel.findById.mockReturnValue(exec(source));
      rulesetModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ version: 3 }),
      });
      rulesetModel.create.mockImplementation(async (data) => ({
        ...data,
        _id: draftId,
      }));
      entryModel.find.mockReturnValue(
        exec([
          doc({
            type: 'race',
            key: 'elf',
            rulesetId: sourceId,
            label: { en: 'Elf' },
          }),
        ]),
      );

      const result = await service.createVersion(sourceId, USER_ID);

      expect(rulesetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'dnd5e-2014',
          version: 4,
          status: 'draft',
          createdBy: USER_ID,
        }),
      );
      expect(entryModel.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'race',
          key: 'elf',
          rulesetId: draftId,
          createdBy: USER_ID,
        }),
      ]);
      // The published source is left untouched.
      expect(source.save).not.toHaveBeenCalled();
      expect(source.status).toBe('published');
      expect(result.data).toMatchObject({ version: 4 });
    });

    it('failure: unknown source ruleset answers 404', async () => {
      rulesetModel.findById.mockReturnValue(exec(null));
      await expect(
        service.createVersion(new Types.ObjectId(), USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('nominal: deletes a draft and its entries', async () => {
      const draft = doc({ _id: new Types.ObjectId(), status: 'draft' });
      rulesetModel.findById.mockReturnValue(exec(draft));

      await service.remove(draft._id);

      expect(entryModel.deleteMany).toHaveBeenCalledWith({
        rulesetId: draft._id,
      });
      expect(draft.deleteOne).toHaveBeenCalled();
    });

    it('failure: a published ruleset cannot be deleted', async () => {
      rulesetModel.findById.mockReturnValue(exec(doc({ status: 'published' })));
      await expect(service.remove(new Types.ObjectId())).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
