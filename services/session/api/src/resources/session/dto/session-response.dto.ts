import { ApiProperty } from '@nestjs/swagger';
import { SessionEntity } from '@/resources/session/entities/session.entity';

export class SessionResponseDto {
    @ApiProperty({ example: 'Session #uuid created in 0.042s' })
    message: string;

    @ApiProperty({ type: SessionEntity })
    data: SessionEntity;
}

export class SessionListResponseDto {
    @ApiProperty({ example: 'Found 3 session(s) for user john in 0.012s' })
    message: string;

    @ApiProperty({ type: [SessionEntity] })
    data: SessionEntity[];
}
