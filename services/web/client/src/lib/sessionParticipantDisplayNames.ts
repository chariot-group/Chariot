import UserService from "@/services/UserService";
import {
    formatSessionParticipantLabelFromWsUsername,
    formatSessionParticipantUserLabel,
    SESSION_PARTICIPANT_NAME_LOADING,
    type SessionParticipantUserLabelSource,
} from "@/lib/formatSessionParticipantUserLabel";
import type { RootState } from "@/store/index";
import { selectSessionParticipantDisplayNames } from "@/store/slices/sessionSlice";

export function resolveSessionParticipantLabelFromSource(
    source: SessionParticipantUserLabelSource,
    wsUsername?: string | null,
): string | null {
    return formatSessionParticipantUserLabel(source) ?? formatSessionParticipantLabelFromWsUsername(wsUsername);
}

export async function fetchSessionParticipantDisplayName(userId: string): Promise<string> {
    try {
        const user = await UserService.getUserById(userId);
        return formatSessionParticipantUserLabel(user) ?? SESSION_PARTICIPANT_NAME_LOADING;
    } catch {
        return SESSION_PARTICIPANT_NAME_LOADING;
    }
}

export function resolveParticipantToastLabel(
    state: RootState,
    userId: string,
    wsUsername?: string | null,
): string {
    const known = selectSessionParticipantDisplayNames(state)[userId];
    if (known && known !== SESSION_PARTICIPANT_NAME_LOADING) {
        return known;
    }
    return formatSessionParticipantLabelFromWsUsername(wsUsername) ?? SESSION_PARTICIPANT_NAME_LOADING;
}
