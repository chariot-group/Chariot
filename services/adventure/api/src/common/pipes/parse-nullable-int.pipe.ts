import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseNullableIntPipe implements PipeTransform {
  transform(value: unknown) {
    if (value === null || value === undefined) {
      return value; // Permet la valeur null ou undefined
    }

    const parsedValue = parseInt(String(value), 10);

    if (isNaN(parsedValue)) {
      throw new BadRequestException('Validation failed. Integer expected');
    }

    return parsedValue;
  }
}
