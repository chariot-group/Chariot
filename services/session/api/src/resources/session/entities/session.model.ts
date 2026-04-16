import { Session as PrismaSession, SessionParticipant as PrismaSessionParticipant } from '@prisma/client';

export type Session = PrismaSession;
export type SessionParticipant = PrismaSessionParticipant;

export type SessionWithParticipants = Session & {
    participants: SessionParticipant[];
};

export type SessionParticipantsDetails = {
    author: {
        userId: string;
        campaignId: string;
    };
    participants: SessionParticipant[];
};
