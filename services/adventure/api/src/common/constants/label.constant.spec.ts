import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NAME_LABEL_MAX_LENGTH } from '@/common/constants/label.constant';
import { CreateCampaignDto } from '@/resources/campaign/dto/create-campaign.dto';
import { UpdateCampaignDto } from '@/resources/campaign/dto/update-campaign.dto';
import { CreateGroupDto } from '@/resources/group/dto/create-group.dto';
import { UpdateGroupDto } from '@/resources/group/dto/update-group.dto';

const atLimit = 'a'.repeat(NAME_LABEL_MAX_LENGTH);
const overLimit = 'a'.repeat(NAME_LABEL_MAX_LENGTH + 1);

const labelErrors = (cls: new () => object, payload: object) =>
  validateSync(plainToInstance(cls, payload), {
    whitelist: true,
    skipMissingProperties: false,
  }).filter((error) => error.property === 'label');

describe('FR-form-field-validation — group and campaign name length', () => {
  const cases: Array<[string, new () => object, object]> = [
    [
      'CreateCampaignDto',
      CreateCampaignDto,
      { groups: { active: [], archived: [] } },
    ],
    ['UpdateCampaignDto', UpdateCampaignDto, {}],
    ['CreateGroupDto', CreateGroupDto, { campaigns: [] }],
    ['UpdateGroupDto', UpdateGroupDto, {}],
  ];

  it.each(cases)('%s accepts a 50-character label', (_, cls, base) => {
    expect(labelErrors(cls, { ...base, label: atLimit })).toHaveLength(0);
  });

  it.each(cases)('%s rejects a 51-character label', (_, cls, base) => {
    const errors = labelErrors(cls, { ...base, label: overLimit });
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it.each(cases)('%s rejects an empty label', (_, cls, base) => {
    expect(labelErrors(cls, { ...base, label: '' })).toHaveLength(1);
  });

  it('UpdateCampaignDto still allows omitting the label', () => {
    expect(labelErrors(UpdateCampaignDto, {})).toHaveLength(0);
  });
});
