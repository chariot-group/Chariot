import apiClient from '@/services/ApiService';

export type SessionStatus = 'activated' | 'launched' | 'closed';

export type ParticipantStatus = 'connected' | 'disconnected' | 'gameMaster';

export type SessionParticipant = {
    id: string;
    userId: string;
    characterId: string | null;
    status: ParticipantStatus;
    joinedAt: string;
    sessionId: string;
};

export type SessionParticipantsDetails = {
    author: {
        userId: string;
        campaignId: string;
    };
    participants: SessionParticipant[];
};

export type SessionEntity = {
    id: string;
    status: SessionStatus;
    creatorUserId: string;
    creatorCampaignId: string;
    expiresAt: string | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    participants: SessionParticipant[];
};

class SessionService {
    async createSession(campaignId: string): Promise<{ code: string }> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        const response = await apiClient().post<{ data: { code: string } }>(
            `${gatewayUrl}/session/sessions`,
            { campaignId },
        );

        return { code: response.data.data.code };
    }

    async getSession(code: string): Promise<SessionEntity> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        const response = await apiClient().get<{ data: SessionEntity }>(
            `${gatewayUrl}/session/sessions/${code}`,
        );

        return response.data.data;
    }

    async joinSession(code: string, characterId?: string | null): Promise<void> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        await apiClient().post(`${gatewayUrl}/session/sessions/${code}/join`, { characterId: characterId ?? null });
    }

    async getParticipants(code: string): Promise<SessionParticipantsDetails> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        const response = await apiClient().get<{ data: SessionParticipantsDetails }>(
            `${gatewayUrl}/session/sessions/${code}/participants`,
        );

        return response.data.data;
    }

    async leaveSession(code: string): Promise<void> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        await apiClient().post(`${gatewayUrl}/session/sessions/${code}/leave`);
    }
}

/** Participants issus du broadcast WS `session:launched` (souvent sérialisés depuis Prisma). */
export function mapParticipantsFromSessionLaunchedPayload(
    raw: unknown,
    fallbackSessionOtpCode: string,
): SessionParticipant[] {
    if (!Array.isArray(raw)) return [];
    const allowed: ReadonlySet<SessionParticipant['status']> = new Set(['connected', 'disconnected', 'gameMaster']);
    const out: SessionParticipant[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const p = item as Record<string, unknown>;
        const userId = p.userId;
        if (typeof userId !== 'string') continue;
        const id = typeof p.id === 'string' ? p.id : userId;
        const characterId: string | null =
            p.characterId == null || p.characterId === '' ? null : String(p.characterId);
        const st = p.status;
        const status: SessionParticipant['status'] =
            typeof st === 'string' && allowed.has(st as SessionParticipant['status'])
                ? (st as SessionParticipant['status'])
                : 'connected';
        let joinedAt = new Date().toISOString();
        if (typeof p.joinedAt === 'string') joinedAt = p.joinedAt;
        else if (p.joinedAt instanceof Date) joinedAt = p.joinedAt.toISOString();
        const sessionId =
            typeof p.sessionId === 'string' && p.sessionId.length > 0 ? p.sessionId : fallbackSessionOtpCode;
        out.push({ id, userId, characterId, status, joinedAt, sessionId });
    }
    return out;
}

export function parseExpiresAtFromLaunchedPayload(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    return null;
}

const sessionService = new SessionService();
export default sessionService;