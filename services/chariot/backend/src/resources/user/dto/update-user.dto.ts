import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@/resources/user/dto/create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
