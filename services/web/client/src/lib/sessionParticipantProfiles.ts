import { formatSessionParticipantUserLabel } from "@/lib/formatSessionParticipantUserLabel";
import type { User } from "@/types/user";

type PublicProfile = Pick<User, "keycloakId" | "firstName" | "lastName" | "username" | "avatar">;

export type SessionParticipantProfile = {
    userId: string;
    label: string | null;
    avatar: string | null;
};

export const PROFILE_RETRY_DELAY_MS = 2000;
export const PROFILE_MAX_ATTEMPTS = 3;

/**
 * Récupère nom + avatar des participants dont le profil n'est pas encore résolu.
 * Un échec n'est jamais définitif : l'id est renvoyé dans `failed` pour être retenté.
 * @see FR-session-participant-labels
 */
export async function fetchParticipantProfiles(
    userIds: string[],
    sessionCode: string,
    getUser: (userId: string, sessionCode: string) => Promise<PublicProfile>,
): Promise<{ resolved: SessionParticipantProfile[]; failed: string[] }> {
    const resolved: SessionParticipantProfile[] = [];
    const failed: string[] = [];
    await Promise.all(
        userIds.map(async (userId) => {
            try {
                const user = await getUser(userId, sessionCode);
                resolved.push({
                    userId,
                    label: formatSessionParticipantUserLabel(user),
                    avatar: user.avatar?.trim() || null,
                });
            } catch {
                failed.push(userId);
            }
        }),
    );
    return { resolved, failed };
}
