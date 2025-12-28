import {
    PipeTransform,
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
    transform(value: string) {
        if (!Types.ObjectId.isValid(value)) {
            throw new BadRequestException(`Error while updating user #${value}: Id is not a valid mongoose id`);
        }

        return new Types.ObjectId(value);
    }
}