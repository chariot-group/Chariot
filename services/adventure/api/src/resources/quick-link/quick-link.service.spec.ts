import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuickLinkService } from '@/resources/quick-link/quick-link.service';
import { QuickLink } from '@/resources/quick-link/schemas/quick-link.schema';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const CAMPAIGN_ID = new Types.ObjectId().toHexString();

describe('QuickLinkService', () => {
  let service: QuickLinkService;
  let quickLinkModel: Record<string, jest.Mock>;

  beforeEach(async () => {
    quickLinkModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickLinkService,
        { provide: getModelToken(QuickLink.name), useValue: quickLinkModel },
      ],
    }).compile();

    service = module.get<QuickLinkService>(QuickLinkService);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a quick link tied to a campaign', async () => {
      const dto = {
        icon: 'Link',
        url: 'https://example.com',
        label: 'Mon lien',
        campaignId: CAMPAIGN_ID,
      };
      const created = { _id: new Types.ObjectId(), ...dto, createdBy: USER_ID };

      quickLinkModel.create.mockResolvedValue(created);

      const result = await service.create(dto, USER_ID);

      expect(quickLinkModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'Link',
          url: 'https://example.com',
          label: 'Mon lien',
          createdBy: USER_ID,
        }),
      );
      expect(result.data).toEqual(created);
    });

    it('should create a quick link with campaignId null for player space', async () => {
      const dto = { icon: 'Star', url: 'https://example.com', label: 'Joueur' };
      const created = {
        _id: new Types.ObjectId(),
        ...dto,
        campaignId: null,
        createdBy: USER_ID,
      };

      quickLinkModel.create.mockResolvedValue(created);

      const result = await service.create(dto, USER_ID);

      expect(quickLinkModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: null }),
      );
      expect(result.data).toEqual(created);
    });
  });

  // ── findAllForUser ───────────────────────────────────────────────────────────

  describe('findAllForUser', () => {
    it('should return all links for a user without campaign filter', async () => {
      const links = [{ _id: new Types.ObjectId(), label: 'A' }];
      quickLinkModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(links),
      });

      const result = await service.findAllForUser(USER_ID);

      expect(quickLinkModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: USER_ID }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should filter links by campaignId', async () => {
      const links = [{ _id: new Types.ObjectId(), label: 'Campaign link' }];
      quickLinkModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(links),
      });

      await service.findAllForUser(USER_ID, CAMPAIGN_ID);

      expect(quickLinkModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: new Types.ObjectId(CAMPAIGN_ID),
        }),
      );
    });

    it('should filter player space links when campaignId is "null"', async () => {
      quickLinkModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      await service.findAllForUser(USER_ID, 'null');

      expect(quickLinkModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: null }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────

  describe('update', () => {
    const linkId = new Types.ObjectId();

    it('should update allowed fields on a link owned by the user', async () => {
      const link = {
        _id: linkId,
        createdBy: USER_ID,
        deletedAt: null,
        icon: 'Link',
        url: 'https://old.com',
        label: 'Old',
        save: jest.fn().mockResolvedValue(undefined),
      };
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(link),
      });

      const result = await service.update(
        linkId,
        { label: 'New label', url: 'https://new.com' },
        USER_ID,
      );

      expect(link.label).toBe('New label');
      expect(link.url).toBe('https://new.com');
      expect(link.icon).toBe('Link');
      expect(link.save).toHaveBeenCalled();
      expect(result.data).toEqual(link);
    });

    it('should throw NotFoundException when link does not exist', async () => {
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(linkId, { label: 'X' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when link belongs to another user', async () => {
      const link = {
        _id: linkId,
        createdBy: OTHER_USER_ID,
        deletedAt: null,
        save: jest.fn(),
      };
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(link),
      });

      await expect(
        service.update(linkId, { label: 'X' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    const linkId = new Types.ObjectId();

    it('should soft-delete a link owned by the user', async () => {
      const link = {
        _id: linkId,
        createdBy: USER_ID,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(link),
      });

      const result = await service.remove(linkId, USER_ID);

      expect(link.save).toHaveBeenCalled();
      expect(link.deletedAt).not.toBeNull();
      expect(result.data).toEqual(link);
    });

    it('should throw NotFoundException when link does not exist', async () => {
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(linkId, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when link belongs to another user', async () => {
      const link = {
        _id: linkId,
        createdBy: OTHER_USER_ID,
        deletedAt: null,
        save: jest.fn(),
      };
      quickLinkModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(link),
      });

      await expect(service.remove(linkId, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
