import type { SessionEntity } from "@/services/SessionService";

/** Non clôturée, non supprimée, et soit lancée et non expirée, soit encore en lobby. */
export function isSessionStillActive(session: SessionEntity, now: Date = new Date()): boolean {
  if (session.status === "closed" || session.deletedAt) return false;
  if (session.expiresAt) return new Date(session.expiresAt).getTime() > now.getTime();
  return session.status === "activated";
}

/**
 * FR-session-lobby-modal — session encore active d'une campagne dont l'utilisateur est le créateur (MJ).
 * Miroir de la recherche serveur `createInTransaction` : non clôturée, non supprimée, et
 * soit lancée et non expirée, soit encore en lobby.
 */
export function findActiveCampaignSession(
  sessions: SessionEntity[],
  campaignId: string,
  userId: string,
  now: Date = new Date(),
): SessionEntity | null {
  return (
    sessions.find((session) => {
      if (session.creatorUserId !== userId || session.creatorCampaignId !== campaignId) return false;
      return isSessionStillActive(session, now);
    }) ?? null
  );
}
