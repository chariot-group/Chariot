import CharacterService from '@/services/CharacterService';
import type { Group, Player } from '@/types/character';

function groupBelongsToCampaign(group: Group, campaignId: string): boolean {
    const camps = group.campaigns ?? [];
    return camps.some((c) => {
        if (typeof c === 'string') return c === campaignId;
        if (c && typeof c === 'object' && '_id' in c) {
            const raw = (c as { _id: unknown })._id;
            return String(raw) === campaignId;
        }
        return false;
    });
}

/**
 * Retire le personnage joueur de tous les groupes rattachés à la campagne de la session.
 * Appelé après une sortie de session volontaire (non‑MJ) pour éviter un roster / groupe désynchronisés.
 */
export async function removePlayerFromCampaignGroupsOnSessionLeave(
    campaignId: string,
    characterId: string,
): Promise<void> {
    const trimmedCampaign = campaignId.trim();
    const trimmedChar = characterId.trim();
    if (!trimmedCampaign || !trimmedChar) return;

    const char = await CharacterService.getCharacterById(trimmedChar);
    const groups = char.groups ?? [];
    const prevIds = groups.map((g) => String(g._id));
    const remainingIds = groups
        .filter((g) => !groupBelongsToCampaign(g, trimmedCampaign))
        .map((g) => String(g._id));

    if (remainingIds.length === prevIds.length) return;

    await CharacterService.updateCharacter(
        'players',
        trimmedChar,
        { groups: remainingIds } as Partial<Player>,
        null,
    );
}
