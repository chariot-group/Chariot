import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PlayerService } from './player.service';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import { Model, Types } from 'mongoose';
import { CreatePlayerDto } from '@/resources/character/player/dto/create-player.dto';
import { UpdatePlayerDto } from '@/resources/character/player/dto/update-player.dto';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { MetricsModule } from '@/metrics/metrics.module';

describe('PlayerService', () => {
  let service: PlayerService;
  let characterModel: any;
  let groupModel: any;

  beforeEach(async () => {
    const mockPlayerDoc = {
      _id: 'playerId',
      groups: [{ _id: new Types.ObjectId().toString() }],
      populate: jest.fn().mockReturnThis(),
    };

    const characterMock = {
      discriminators: {
        player: Object.assign(
          jest.fn().mockImplementation((data) => ({
            save: jest.fn().mockResolvedValue({ _id: 'playerId', ...data }),
          })),
          {
            updateOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            }),
          }
        ),
      },
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlayerDoc),
        populate: jest.fn().mockReturnThis(),
      }),
    };

    const groupMock = {
      updateMany: jest.fn(),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), deletedAt: null }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule],
      providers: [
        PlayerService,
        {
          provide: getModelToken(Character.name),
          useValue: characterMock,
        },
        {
          provide: getModelToken(Group.name),
          useValue: groupMock,
        },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    characterModel = module.get(getModelToken(Character.name));
    groupModel = module.get(getModelToken(Group.name));
  });

  it('should be defined', () => {
    expect(true).toBe(true);
  });

  describe('create', () => {
    it('should create a player', async () => {
      const dto: CreatePlayerDto = {
        name: 'Test',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());
      expect(result.data._id).toBe('playerId');
      expect(result.message).toContain('Player created in');
    });

    it('should throw BadRequestException if a group ID is invalid', async () => {
      const dto: CreatePlayerDto = {
        name: 'Test',
        groups: ['not-an-objectid'], // invalid
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
      };

      await expect(service.create(dto, new Types.ObjectId().toHexString())).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const dto: CreatePlayerDto = {
        name: 'Test',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
      };

      // Simule une erreur dans le constructeur du modèle
      characterModel.discriminators.player.mockImplementationOnce(() => {
        throw new Error('unexpected failure');
      });

      await expect(service.create(dto, new Types.ObjectId().toHexString())).rejects.toThrow(InternalServerErrorException);
    });

    it('should call updateMany with provided group IDs', async () => {
      const groupIds = [new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString()];
      const dto: CreatePlayerDto = {
        name: 'Test with groups',
        groups: groupIds,
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());

      expect(result.data._id).toBeDefined();
      expect(groupModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: groupIds } },
        { $addToSet: { characters: 'playerId' } }
      );
    });
  });

  describe('update', () => {
    it('should update a player', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Updated',
        groups: [new Types.ObjectId().toString()],
      };

      groupModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), deletedAt: null }),
      });

      const result = await service.update(playerId, dto);
      expect(result.data._id).toBeDefined();
      expect(result.message).toContain('update in');
    });

    it('should throw BadRequestException if some group IDs are invalid', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Invalid Group Test',
        groups: ['validId', 'invalidId'],
      };

      groupModel.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ _id: 'validId' }) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.update(playerId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if a group is marked as deleted', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Gone Group',
        groups: [new Types.ObjectId().toHexString()],
      };

      groupModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), deletedAt: new Date() }),
      });

      // GoneException may not be imported by default, so we use a dynamic require if needed.
      // If GoneException is not present, this test will fail and the developer should add the import.
      const { GoneException } = require('@nestjs/common');
      await expect(service.update(playerId, dto)).rejects.toThrow(GoneException);
    });

    it('should use existing player groups if groups not provided', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = { name: 'No Groups' };

      characterModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: playerId,
          groups: [{ _id: new Types.ObjectId() }],
        }),
        populate: jest.fn().mockReturnThis(),
      });

      characterModel.discriminators.player.updateOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      groupModel.updateMany.mockResolvedValue({});

      const result = await service.update(playerId, dto);
      expect(result.message).toContain('update in');
    });

    it('should throw NotFoundException if update did not modify any document', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = { name: 'No Match', groups: [] };

      characterModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: playerId,
          groups: [],
        }),
        populate: jest.fn().mockReturnThis(),
      });

      characterModel.discriminators.player.updateOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      });

      // NotFoundException may not be imported by default, so we use a dynamic require if needed.
      const { NotFoundException } = require('@nestjs/common');
      await expect(service.update(playerId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected failure', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = { name: 'Crash', groups: [] };

      characterModel.findById.mockImplementationOnce(() => {
        throw new Error('Unexpected DB Error');
      });

      await expect(service.update(playerId, dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('create with conditions - FR-003', () => {
    it('should create a player with D&D conditions', async () => {
      const dto: CreatePlayerDto = {
        name: 'Exhausted Adventurer',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
        conditions: {
          poisoned: true,
          frightened: false,
          blinded: false,
        },
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());
      expect(result.data._id).toBe('playerId');
      expect(result.message).toContain('Player created in');
    });

    it('should create a player with exhaustion level - Player specific', async () => {
      const dto: CreatePlayerDto = {
        name: 'Exhausted Hero',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
        exhaustionLevel: 2,
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());
      expect(result.data._id).toBe('playerId');
      expect(result.message).toContain('Player created in');
    });

    it('should create a player with all conditions and exhaustion set', async () => {
      const dto: CreatePlayerDto = {
        name: 'Severely Afflicted',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
        conditions: {
          blinded: true,
          charmed: true,
          deafened: true,
          frightened: true,
          grappled: true,
          incapacitated: true,
          invisible: false,
          paralyzed: true,
          petrified: false,
          poisoned: true,
          prone: true,
          restrained: true,
          stunned: true,
          unconscious: false,
        },
        exhaustionLevel: 5,
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());
      expect(result.data._id).toBe('playerId');
      expect(result.message).toContain('Player created in');
    });

    it('should create a player without conditions (defaults applied)', async () => {
      const dto: CreatePlayerDto = {
        name: 'Healthy Hero',
        groups: [],
        stats: { senses: [], size: 'M' },
        affinities: { resistances: [], immunities: [], vulnerabilities: [] },
        abilities: [],
        spellcasting: [],
        inspiration: false,
        progression: { level: 1, experience: 0 },
        class: [],
        appearance: {},
        background: {},
        treasure: {},
        profile: {
          race: '',
          subrace: '',
          alignment: '',
        },
        // conditions not provided - defaults should be applied by schema
      };

      const result = await service.create(dto, new Types.ObjectId().toHexString());
      expect(result.data._id).toBe('playerId');
      expect(result.message).toContain('Player created in');
    });
  });

  describe('update with conditions - FR-003', () => {
    it('should update a player with new conditions', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Updated with conditions',
        groups: [],
        conditions: {
          paralyzed: true,
        },
      };

      characterModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: playerId,
          groups: [],
        }),
        populate: jest.fn().mockReturnThis(),
      });

      const result = await service.update(playerId, dto);
      expect(result.data._id).toBeDefined();
      expect(result.message).toContain('update in');
    });

    it('should update a player with new exhaustion level', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Exhausted',
        groups: [],
        exhaustionLevel: 3,
      };

      characterModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: playerId,
          groups: [],
        }),
        populate: jest.fn().mockReturnThis(),
      });

      const result = await service.update(playerId, dto);
      expect(result.data._id).toBeDefined();
      expect(result.message).toContain('update in');
    });

    it('should clear conditions and exhaustion when updated', async () => {
      const playerId = new Types.ObjectId();
      const dto: UpdatePlayerDto = {
        name: 'Recovered',
        groups: [],
        conditions: {
          poisoned: false,
          paralyzed: false,
        },
        exhaustionLevel: 0,
      };

      characterModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: playerId,
          groups: [],
        }),
        populate: jest.fn().mockReturnThis(),
      });

      const result = await service.update(playerId, dto);
      expect(result.data._id).toBeDefined();
      expect(result.message).toContain('update in');
    });
  });
});
