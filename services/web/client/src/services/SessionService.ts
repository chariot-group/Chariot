import apiClient from '@/services/ApiService';

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

class SessionService {
    async createSession(campaignId: string): Promise<void> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        const response = await apiClient().post<{ data: { code: string } }>(
            `${gatewayUrl}/session/sessions`,
            { campaignId },
        );

        const code = response.data.data.code;
        window.location.href = `/campaigns/${campaignId}/session/${code}`;
    }

    async getSession(code: string): Promise<void> {
        const gatewayUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!gatewayUrl) {
            throw new Error('API URL is not defined. Set NEXT_PUBLIC_API_URL in your environment.');
        }

        await apiClient().get(`${gatewayUrl}/session/sessions/${code}`);
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

const sessionService = new SessionService();
export default sessionService;