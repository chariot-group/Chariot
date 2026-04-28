import { ApiProperty } from '@nestjs/swagger';

export class GenericResponseDto<T> {
    @ApiProperty({
        description: 'A descriptive message about the result of the operation.',
        example: 'Operation successful',
    })
    message: string;

    @ApiProperty({
        description: 'The data payload of the response.',
    })
    data: T;
}
