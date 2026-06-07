export type SessionUnavailableReason = "closed" | "expired" | "notFound";

/**
 * Détecte les erreurs gateway/API indiquant qu'une session n'est plus joignable
 * (clôturée, expirée, supprimée ou introuvable).
 */
export function parseSessionUnavailableReason(message: unknown): SessionUnavailableReason | null {
    if (typeof message !== "string" || !message.trim()) {
        return null;
    }
    const lower = message.toLowerCase();
    if (lower.includes("expired")) {
        return "expired";
    }
    if (lower.includes("closed")) {
        return "closed";
    }
    if (lower.includes("not found") || lower.includes("deleted")) {
        return "notFound";
    }
    return null;
}

export function isSessionUnavailableMessage(message: unknown): boolean {
    return parseSessionUnavailableReason(message) != null;
}
