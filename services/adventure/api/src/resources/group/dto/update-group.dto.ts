import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from '@/resources/group/dto/create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
