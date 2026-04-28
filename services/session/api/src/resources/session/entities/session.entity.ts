import { ApiProperty } from '@nestjs/swagger';
import { SessionParticipantEntity } from '@/resources/session/entities/session-participant.entity';

export enum SessionStatus {
    activated = 'activated',
    launched = 'launched',
    closed = 'closed',
}

export class SessionEntity {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'AB3X7K' })
    code: string;

    @ApiProperty({ enum: SessionStatus, example: SessionStatus.activated })
    status: SessionStatus;

    @ApiProperty({ example: '2026-04-11T18:00:00.000Z', nullable: true, required: false })
    expiresAt: Date | null;

    @ApiProperty({ example: null, nullable: true, required: false })
    deletedAt: Date | null;

    @ApiProperty({ example: '2026-04-11T10:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-04-11T10:00:00.000Z' })
    updatedAt: Date;

    @ApiProperty({ example: 'kc-user-uuid-123' })
    creatorUserId: string;

    @ApiProperty({ example: 'camp_abc123' })
    creatorCampaignId: string;

    @ApiProperty({ type: [SessionParticipantEntity] })
    participants: SessionParticipantEntity[];
}
