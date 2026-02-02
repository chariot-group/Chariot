import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  Campaign,
  CampaignDocument,
} from '@/resources/campaign/schemas/campaign.schema';
import { Group, GroupDocument } from '@/resources/group/schemas/group.schema';
import 'reflect-metadata';
import {
  Character,
  CharacterDocument,
} from '@/resources/character/core/schemas/character.schema';
import { KeycloakAdminService } from '@/seeder/keycloak-admin.service';
import { User, UserDocument } from '@/resources/user/schemas/user.schema';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) { }

  getRandomObjects(kind?: string) {
    const filePath = path.join(__dirname, 'runner', 'characters.json');
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const shuffled = [...jsonData].sort(() => 0.5 - Math.random());
    const filtered = kind
      ? shuffled.filter((obj) => obj.kind === kind)
      : shuffled;

    return filtered.slice(
      0,
      faker.number.int({ min: 0, max: filtered.length }),
    );
  }

  readonly SERVICE_NAME: string = this.constructor.name;

  async seed(clean: boolean) {
    if (clean) {
      Logger.log('Cleaning database...', this.SERVICE_NAME);
      await this.campaignModel.deleteMany({});
      await this.groupModel.deleteMany({});
      await this.characterModel.deleteMany({});

      Logger.log('Cleaning Keycloak users...', this.SERVICE_NAME);
      await this.keycloakAdminService.deleteAllUsers();

      Logger.log('Database cleaned', this.SERVICE_NAME);
    }

    const userCount = faker.number.int({ min: 4, max: 8 });

    for (let i = 0; i < userCount; i++) {
      const username = faker.internet.username();
      const email = faker.internet.email();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const password = process.env.DEFAULT_PASSWORD;
      const balance = faker.number.int({ min: 0, max: 1000 });

      // Générer une URL d'avatar aléatoire
      // Utilise DiceBear API pour des avatars SVG générés aléatoirement
      const avatarSeed = faker.string.alphanumeric(10);
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

      const userId = await this.keycloakAdminService.createUser(
        username,
        email,
        password,
        firstName,
        lastName,
        avatarUrl,
      );

      // Générer un nombre aléatoire d'entrées d'historique
      const historyCount = faker.number.int({ min: 0, max: 60 });
      const history = [];

      for (let h = 0; h < historyCount; h++) {
        history.push({
          date: faker.date.past({ years: 2 }),
          campaignName: faker.lorem.words(3),
          value: faker.number.int({ min: 1, max: 10 }),
        });
      }

      // Trier l'historique par date (du plus ancien au plus récent)
      history.sort((a, b) => a.date.getTime() - b.date.getTime());

      await this.userModel.create({
        keycloakId: userId,
        balance: balance,
        history: history,
      });

      await this.characterModel.create(
        this.getRandomObjects('player').map((character) => ({
          ...character,
          createdBy: userId,
        })),
      );

      const campaigns = [];
      const campaignsPerUser: number = faker.number.int({ min: 0, max: 3 });

      for (let j = 0; j < campaignsPerUser; j++) {
        const activeGroups = [];
        const archivedGroups = [];

        const groupsActivePerCampaign: number = faker.number.int({
          min: 0,
          max: 6,
        });
        const groupsArchivedPerCampaign: number = faker.number.int({
          min: 0,
          max: 6,
        });

        for (let k = 0; k < groupsActivePerCampaign; k++) {
          const activeCharacters = await this.characterModel.create(
            this.getRandomObjects().map((character) => ({
              ...character,
              createdBy: userId,
            })),
          );

          const activeGroup = await this.groupModel.create({
            label: faker.company.name(),
            active: faker.number.int({ min: 0, max: 1 }) === 1,
            characters: activeCharacters.map((c) => c._id),
            createdBy: userId,
          });

          activeCharacters.forEach((c: CharacterDocument) => {
            c.groups.push(activeGroup.id);
            c.createdBy = activeGroup.createdBy;
            c.save();
          });

          activeGroups.push(activeGroup._id);
        }

        for (let k = 0; k < groupsArchivedPerCampaign; k++) {
          const archivedCharacters = await this.characterModel.create(
            this.getRandomObjects().map((character) => ({
              ...character,
              createdBy: userId,
            })),
          );

          const archivedGroup = await this.groupModel.create({
            label: faker.company.name(),
            active: faker.number.int({ min: 0, max: 1 }) === 1,
            characters: archivedCharacters.map((c) => c._id),
            createdBy: userId,
          });

          archivedCharacters.forEach((c: CharacterDocument) => {
            c.groups.push(archivedGroup.id);
            c.createdBy = archivedGroup.createdBy;
            c.save();
          });

          archivedGroups.push(archivedGroup._id);
        }

        const campaign = await this.campaignModel.create({
          label: faker.lorem.words(3),
          groups: {
            active: activeGroups,
            archived: archivedGroups,
          },
          createdBy: userId,
        });

        await this.groupModel.updateMany(
          { _id: { $in: activeGroups.map((id) => id) } },
          { $addToSet: { campaigns: campaign._id } },
        );

        await this.groupModel.updateMany(
          { _id: { $in: archivedGroups.map((id) => id) } },
          { $addToSet: { campaigns: campaign._id } },
        );

        campaigns.push(campaign._id);
      }
    }
  }
}
