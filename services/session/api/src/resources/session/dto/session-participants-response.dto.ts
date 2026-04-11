import { ApiProperty } from '@nestjs/swagger';
import { SessionParticipantEntity } from '@/resources/session/entities/session-participant.entity';

export class SessionAuthorDto {
    @ApiProperty({ example: 'kc-user-uuid-123' })
    userId: string;

    @ApiProperty({ example: 'camp_abc123' })
    campaignId: string;
}

export class SessionParticipantsDataDto {
    @ApiProperty({ type: SessionAuthorDto })
    author: SessionAuthorDto;

    @ApiProperty({ type: [SessionParticipantEntity] })
    participants: SessionParticipantEntity[];
}

export class SessionParticipantsResponseDto {
    @ApiProperty({ example: 'Found 2 participant(s) for session #uuid in 0.008s' })
    message: string;

    @ApiProperty({ type: SessionParticipantsDataDto })
    data: SessionParticipantsDataDto;
}
