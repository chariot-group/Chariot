import { ApiProperty } from '@nestjs/swagger';

export class IResponse<T> {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty()
  data: T;
}
