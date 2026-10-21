import NavigationService from "@/services/NavigationService";
import type { AppDispatch, RootState } from "@/store";
import { selectSessionCampaignId, selectSessionParticipants } from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";

/** Snapshot taken before session state is cleared (FR-session-end-navigation). */
export interface SessionEndContext {
    locale: string;
    pathname: string;
    isGameMaster: boolean;
    campaignId: string | null;
}

interface SessionEndRouter {
    push: (path: string) => void;
}

let lastSessionEndNavigationKey: string | null = null;

function localeFromPathname(pathname: string): string {
    return pathname.split("/")[1] || "fr";
}

export function captureSessionEndContext(
    state: RootState,
    pathname: string,
    overrides?: { campaignId?: string | null },
): SessionEndContext {
    const userId = selectUser(state)?.keycloakId;
    const isGameMaster = Boolean(
        userId &&
            selectSessionParticipants(state).some(
                (participant) => participant.userId === userId && participant.status === "gameMaster",
            ),
    );
    return {
        locale: localeFromPathname(pathname),
        pathname,
        isGameMaster,
        campaignId: overrides?.campaignId ?? selectSessionCampaignId(state) ?? null,
    };
}

/** True when the current route stays valid after the session ended. */
export function shouldStayOnRouteAfterSessionEnd(context: SessionEndContext): boolean {
    const [, section, id] = context.pathname.split("/").filter(Boolean);
    if (section === "characters" && Boolean(id)) {
        return true;
    }
    return Boolean(context.isGameMaster && context.campaignId && section === "campaigns" && id === context.campaignId);
}

/** Returns the path to navigate to, or null to stay on the current page. */
export async function resolveSessionEndPath(
    context: SessionEndContext,
    dispatch: AppDispatch,
    getState: () => RootState,
): Promise<string | null> {
    if (shouldStayOnRouteAfterSessionEnd(context)) {
        return null;
    }
    try {
        if (context.isGameMaster && context.campaignId) {
            const spaceDestination = await NavigationService.determineSpaceDestination(context.campaignId, context.locale);
            if (spaceDestination.reason !== "no-characters") {
                return spaceDestination.path;
            }
        }
        const destination = await NavigationService.determinePostLoginDestination(context.locale, dispatch, getState);
        return destination.path;
    } catch {
        return `/${context.locale}/welcome`;
    }
}

/** At most one navigation per ended session, whichever subscriber observes the end first. */
export function claimSessionEndNavigation(sessionCode: string): boolean {
    const key = sessionCode.trim();
    if (!key || lastSessionEndNavigationKey === key) {
        return false;
    }
    lastSessionEndNavigationKey = key;
    return true;
}

export function resetSessionEndNavigationClaim(): void {
    lastSessionEndNavigationKey = null;
}

export async function navigateAfterSessionEnd(params: {
    sessionCode: string;
    context: SessionEndContext;
    router: SessionEndRouter;
    dispatch: AppDispatch;
    getState: () => RootState;
}): Promise<void> {
    if (!claimSessionEndNavigation(params.sessionCode)) {
        return;
    }
    const path = await resolveSessionEndPath(params.context, params.dispatch, params.getState);
    if (path) {
        params.router.push(path);
    }
}
