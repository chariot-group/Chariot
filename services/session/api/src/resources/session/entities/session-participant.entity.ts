import { ApiProperty } from '@nestjs/swagger';

export enum ParticipantStatus {
    connected = 'connected',
    disconnected = 'disconnected',
    MasterGame = 'MasterGame',
}

export class SessionParticipantEntity {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
    userId: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', nullable: true, required: false })
    characterId: string | null;

    @ApiProperty({ enum: ParticipantStatus, example: ParticipantStatus.connected })
    status: ParticipantStatus;

    @ApiProperty({ example: '2026-04-11T10:00:00.000Z' })
    joinedAt: Date;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
    sessionId: string;
}
