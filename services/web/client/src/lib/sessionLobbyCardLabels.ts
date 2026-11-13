export type SessionLobbyCardLabels = {
    /** Ligne mise en avant (titre de la carte). */
    primary: string;
    /** Ligne secondaire ; vide si rien à afficher. */
    secondary: string;
};

/**
 * Hiérarchie des noms d'une carte du lobby : personnage assigné en principal et
 * libellé du participant en secondaire, pour rester cohérent avec l'avatar du personnage.
 * Sans personnage (MJ ou joueur pas encore positionné) : libellé du participant en principal.
 *
 * @see FR-session-participant-labels (Lobby Card Hierarchy & Ordering)
 */
export function resolveSessionLobbyCardLabels({
    isGameMaster,
    participantName,
    characterLabel,
}: {
    isGameMaster: boolean;
    participantName: string;
    characterLabel: string | null | undefined;
}): SessionLobbyCardLabels {
    const character = characterLabel?.trim() ?? "";
    if (isGameMaster || !character) {
        return { primary: participantName, secondary: "" };
    }
    return { primary: character, secondary: participantName };
}
