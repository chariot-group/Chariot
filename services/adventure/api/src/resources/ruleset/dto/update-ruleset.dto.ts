import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRulesetDto } from '@/resources/ruleset/dto/create-ruleset.dto';

/** Draft only; key, gameSystem, version and status are not editable. */
export class UpdateRulesetDto extends PartialType(
  OmitType(CreateRulesetDto, ['key', 'gameSystem'] as const),
) {}
