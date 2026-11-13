import type { SessionEntity, SessionParticipant } from "@/services/SessionService";

/** Non clôturée, non supprimée, et soit lancée et non expirée, soit encore en lobby. */
export function isSessionStillActive(session: SessionEntity, now: Date = new Date()): boolean {
  if (session.status === "closed" || session.deletedAt) return false;
  if (session.expiresAt) return new Date(session.expiresAt).getTime() > now.getTime();
  return session.status === "activated";
}

/**
 * FR-session-lobby-modal — joueur : « Retour en session » seulement après le lancement :
 * un lobby jamais lancé n'offre pas de retour.
 */
export function isLaunchedSessionStillActive(session: SessionEntity | null, now: Date = new Date()): boolean {
  return session !== null && session.status === "launched" && isSessionStillActive(session, now);
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

/**
 * FR-session-lobby-modal — code mémorisé à la sortie : seulement si la session avait été lancée.
 * Quitter un lobby jamais lancé remet la mémoire à zéro (« Rejoindre la session », sans préremplissage).
 */
export function resolveLastLeftSessionCode(code: string | null | undefined, wasLaunched: boolean): string | null {
  return wasLaunched && code ? code : null;
}

/**
 * FR-session-lobby-modal — au moins un joueur (hors MJ) a rejoint la session.
 * Un participant qui quitte est supprimé côté serveur : il ne compte plus.
 */
export function hasJoinedPlayer(participants: readonly Pick<SessionParticipant, "userId" | "status">[], gmUserId: string): boolean {
  return participants.some((participant) => participant.userId !== gmUserId && participant.status !== "gameMaster");
}

/**
 * FR-session-lobby-modal — le MJ « retourne » à une session encore active dès qu'elle est lancée
 * ou qu'un joueur l'a rejointe ; un lobby vide jamais lancé reste « Lancer une session ».
 */
export function shouldGmReturnToSession(session: SessionEntity | null, gmUserId: string, now: Date = new Date()): boolean {
  if (!session || !isSessionStillActive(session, now)) return false;
  return session.status === "launched" || hasJoinedPlayer(session.participants ?? [], gmUserId);
}
