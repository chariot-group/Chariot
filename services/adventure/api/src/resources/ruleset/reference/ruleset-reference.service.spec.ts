import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { RulesetReferenceService } from '@/resources/ruleset/reference/ruleset-reference.service';

/** @see FR-game-system — Ruleset reference */
describe('RulesetReferenceService', () => {
  const published = {
    _id: new Types.ObjectId(),
    key: 'dnd5e-2014',
    gameSystem: 'DND_5E',
    status: 'published',
  };
  const archived = {
    ...published,
    _id: new Types.ObjectId(),
    status: 'archived',
  };
  const query = (value: unknown) => {
    const q = { select: jest.fn(), sort: jest.fn(), exec: jest.fn() };
    q.select.mockReturnValue(q);
    q.sort.mockReturnValue(q);
    q.exec.mockResolvedValue(value);
    return q;
  };
  let model: { findById: jest.Mock; findOne: jest.Mock };
  let service: RulesetReferenceService;

  beforeEach(() => {
    model = { findById: jest.fn(), findOne: jest.fn() };
    service = new RulesetReferenceService(model as never);
  });

  describe('idForCreate', () => {
    it('nominal: without rulesetId, defaults to the published ruleset of the game system', async () => {
      model.findOne.mockReturnValue(query(published));

      await expect(service.idForCreate('DND_5E')).resolves.toBe(published._id);
      expect(model.findOne).toHaveBeenCalledWith({
        gameSystem: 'DND_5E',
        status: 'published',
      });
    });

    it('edge: no game system given → DND_5E default; none published → null', async () => {
      model.findOne.mockReturnValue(query(null));

      await expect(service.idForCreate(undefined)).resolves.toBeNull();
      expect(model.findOne).toHaveBeenCalledWith({
        gameSystem: 'DND_5E',
        status: 'published',
      });
    });

    it('edge: an explicit rulesetId of the same game system is kept (even archived)', async () => {
      model.findById.mockReturnValue(query(archived));

      const id = await service.idForCreate('DND_5E', String(archived._id));

      expect(String(id)).toBe(String(archived._id));
      expect(model.findOne).not.toHaveBeenCalled();
    });

    it('failure: unknown rulesetId → 400', async () => {
      model.findById.mockReturnValue(query(null));

      await expect(
        service.idForCreate('DND_5E', String(new Types.ObjectId())),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('failure: rulesetId of another game system → 400', async () => {
      model.findById.mockReturnValue(
        query({ ...published, gameSystem: 'OTHER' }),
      );

      await expect(
        service.idForCreate('DND_5E', String(published._id)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resolvePublished', () => {
    it('nominal: a published reference resolves to itself', async () => {
      model.findById.mockReturnValue(query(published));

      await expect(
        service.resolvePublished(String(published._id), 'DND_5E'),
      ).resolves.toBe(published);
      expect(model.findOne).not.toHaveBeenCalled();
    });

    it('edge: an archived reference resolves to the published version of its key', async () => {
      model.findById.mockReturnValue(query(archived));
      model.findOne.mockReturnValue(query(published));

      await expect(
        service.resolvePublished(String(archived._id), 'DND_5E'),
      ).resolves.toBe(published);
      expect(model.findOne).toHaveBeenCalledWith({
        key: 'dnd5e-2014',
        status: 'published',
      });
    });

    it('edge: no reference (document created before the attribute) → published ruleset of the game system', async () => {
      model.findOne.mockReturnValue(query(published));

      await expect(service.resolvePublished(null, 'DND_5E')).resolves.toBe(
        published,
      );
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('failure: nothing published → null', async () => {
      model.findById.mockReturnValue(query(archived));
      model.findOne.mockReturnValue(query(null));

      await expect(
        service.resolvePublished(String(archived._id), 'DND_5E'),
      ).resolves.toBeNull();
    });
  });
});
