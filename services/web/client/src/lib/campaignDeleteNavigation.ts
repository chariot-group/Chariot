import NavigationService from "@/services/NavigationService";

export function localeFromPathname(pathname: string | null | undefined): string {
    return pathname?.split("/")[1] || "fr";
}

/**
 * Destination after deleting a group or a character of a campaign (FR-welcome-onboarding-fallbacks §3):
 * another character of the same campaign if any, else the Campaign fallback. Never the Player space,
 * never the creation form; `/welcome` only when resolution fails.
 */
export async function resolveCampaignDeleteDestination(campaignId: string, locale: string): Promise<string> {
    try {
        const destination = await NavigationService.determineSpaceDestination(campaignId, locale);
        return destination.path;
    } catch {
        return `/${locale}/welcome`;
    }
}
