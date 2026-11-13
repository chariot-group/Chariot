"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerRemoteCharacterSheetUpdatedListener } from "@/lib/sessionCharacterSyncBridge";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import campaignService from "@/services/CampaignService";
import characterService from "@/services/CharacterService";
import sessionService, { type SessionParticipant } from "@/services/SessionService";
import UserService from "@/services/UserService";
import { resolveSessionCharacterLabel } from "@/lib/formatSessionCharacterLabel";
import {
    fetchParticipantProfiles,
    PROFILE_MAX_ATTEMPTS,
    PROFILE_RETRY_DELAY_MS,
} from "@/lib/sessionParticipantProfiles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useStore } from "react-redux";
import type { RootState } from "@/store";
import { captureSessionEndContext, navigateAfterSessionEnd } from "@/lib/sessionEndNavigation";
import {
    clearCurrentSession,
    setCurrentSession,
    setSessionStatus,
    setSessionExpiresAt,
    selectIsInSession,
    selectSessionParticipantDisplayNames,
    mergeSessionParticipantDisplayNames,
    pruneSessionParticipantDisplayNames,
} from "@/store/slices/sessionSlice";
import { isSessionUnavailableMessage } from "@/lib/sessionUnavailableError";
import { useToast } from "@/hooks/useToast";
import type { Character } from "@/types/character";
import type { Campaign } from "@/types/campaign";
import { loadCompanionCountsForPlayers, orderSessionCharactersLikeSidebar } from "@/lib/sessionJoinCompanionVisibility";
import { selectCharactersWithoutGroup } from "@/store/slices/characterSlice";

const CHARACTER_FETCH_RETRY_DELAY_MS = 350;

interface UseSessionDataOptions {
    code: string;
    idCampaign: string;
    campaign: Campaign | undefined;
}

async function fetchCharacterByIdWithRetry(
    characterId: string,
    sessionCode: string,
): Promise<Character | null> {
    try {
        return await characterService.getCharacterById(characterId, { sessionCode });
    } catch {
        await new Promise((resolve) => setTimeout(resolve, CHARACTER_FETCH_RETRY_DELAY_MS));
        try {
            return await characterService.getCharacterById(characterId, { sessionCode });
        } catch {
            return null;
        }
    }
}

export function useSessionData({ code, idCampaign, campaign }: UseSessionDataOptions): {
    campaignLabel: string | null;
    locale: string;
    participants: SessionParticipant[];
    setParticipants: React.Dispatch<React.SetStateAction<SessionParticipant[]>>;
    participantNames: Record<string, string>;
    participantAvatars: Record<string, string | null | undefined>;
    characterDetails: Record<string, Character>;
    myCharacters: Character[];
    companionCountByCharacterId: Record<string, number>;
    fetchCharacterDetails: (ids: string[]) => Promise<void>;
    getCharacterLabel: (characterId: string | null) => string;
    isLoading: boolean;
} {

    const dispatch = useAppDispatch();
    const store = useStore<RootState>();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const participantNames = useAppSelector(selectSessionParticipantDisplayNames);
    const isAlreadyInSession = useAppSelector(selectIsInSession);
    const sidebarPlayers = useAppSelector(selectCharactersWithoutGroup);

    const [campaignLabel, setCampaignLabel] = useState<string | null>(null);
    const [participants, setParticipants] = useState<SessionParticipant[]>([]);
    const [participantAvatars, setParticipantAvatars] = useState<Record<string, string | null | undefined>>({});
    const [characterDetails, setCharacterDetails] = useState<Record<string, Character>>({});
    const [fetchedMyCharacters, setFetchedMyCharacters] = useState<Character[]>([]);
    const myCharacters = useMemo(
        () => orderSessionCharactersLikeSidebar(fetchedMyCharacters, sidebarPlayers),
        [fetchedMyCharacters, sidebarPlayers],
    );
    const [companionCountByCharacterId, setCompanionCountByCharacterId] = useState<Record<string, number>>(
        {},
    );
    const [isLoading, setIsLoading] = useState(true);

    /** Toujours à jour : les handlers WebSocket gardent une ref stable (voir `useSessionSocket` deps `[token]`). */
    const characterDetailsRef = useRef<Record<string, Character>>({});
    characterDetailsRef.current = characterDetails;

    const fetchCharacterDetails = useCallback(async (ids: string[]) => {
        const targets = ids.filter((id) => Boolean(id?.trim()));
        if (targets.length === 0) return;
        const results = await Promise.all(
            targets.map((id) => fetchCharacterByIdWithRetry(id, code)),
        );
        setCharacterDetails((prev) => {
            const next = { ...prev };
            results.forEach((character, i) => {
                if (character) {
                    next[targets[i]] = character;
                }
            });
            return next;
        });
    }, [code]);

    /** @see FR-session-participant-labels — profil (nom + PP) de chaque participant, y compris ceux arrivés après l'ouverture du lobby. */
    const resolvedProfileIdsRef = useRef<Set<string>>(new Set());
    const pendingProfileIdsRef = useRef<Set<string>>(new Set());
    const profileAttemptsRef = useRef<Map<string, number>>(new Map());
    const profileRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profileRetryTick, setProfileRetryTick] = useState(0);

    const loadParticipantProfiles = useCallback(
        async (userIds: string[]) => {
            const targets = Array.from(new Set(userIds)).filter(
                (id) =>
                    Boolean(id?.trim()) &&
                    !resolvedProfileIdsRef.current.has(id) &&
                    !pendingProfileIdsRef.current.has(id),
            );
            if (targets.length === 0) return;
            targets.forEach((id) => pendingProfileIdsRef.current.add(id));

            const { resolved, failed } = await fetchParticipantProfiles(targets, code, (id, sessionCode) =>
                UserService.getUserById(id, sessionCode),
            );
            targets.forEach((id) => pendingProfileIdsRef.current.delete(id));

            if (resolved.length > 0) {
                resolved.forEach(({ userId }) => resolvedProfileIdsRef.current.add(userId));
                setParticipantAvatars((prev) => ({
                    ...prev,
                    ...Object.fromEntries(resolved.map(({ userId, avatar }) => [userId, avatar])),
                }));
                const names = Object.fromEntries(
                    resolved.flatMap(({ userId, label }) => (label ? [[userId, label] as const] : [])),
                );
                if (Object.keys(names).length > 0) {
                    dispatch(mergeSessionParticipantDisplayNames(names));
                }
            }

            const retryable = failed.filter((id) => {
                const attempts = (profileAttemptsRef.current.get(id) ?? 0) + 1;
                profileAttemptsRef.current.set(id, attempts);
                return attempts < PROFILE_MAX_ATTEMPTS;
            });
            if (retryable.length > 0 && profileRetryTimerRef.current === null) {
                profileRetryTimerRef.current = setTimeout(() => {
                    profileRetryTimerRef.current = null;
                    setProfileRetryTick((tick) => tick + 1);
                }, PROFILE_RETRY_DELAY_MS);
            }
        },
        [code, dispatch],
    );

    useEffect(() => {
        void loadParticipantProfiles(participants.map((p) => p.userId));
    }, [participants, profileRetryTick, loadParticipantProfiles]);

    useEffect(
        () => () => {
            if (profileRetryTimerRef.current !== null) {
                clearTimeout(profileRetryTimerRef.current);
                profileRetryTimerRef.current = null;
            }
        },
        [],
    );

    useEffect(() => {
        registerRemoteCharacterSheetUpdatedListener((characterId) => {
            void fetchCharacterDetails([characterId]);
        });
        return () => registerRemoteCharacterSheetUpdatedListener(null);
    }, [fetchCharacterDetails]);

    useEffect(() => {
        let cancelled = false;

        const redirectAfterUnavailableSession = () => {
            const context = captureSessionEndContext(store.getState(), pathname, { campaignId: idCampaign });
            dispatch(clearCurrentSession());
            toast.info(t("toast.sessionNotFound"));
            void navigateAfterSessionEnd({
                sessionCode: code,
                context,
                router,
                dispatch,
                getState: () => store.getState(),
            });
        };

        const init = async () => {
            setCompanionCountByCharacterId({});
            resolvedProfileIdsRef.current.clear();
            pendingProfileIdsRef.current.clear();
            profileAttemptsRef.current.clear();
            try {
                const session = await sessionService.getSession(code);
                if (cancelled) return;

                dispatch(setCurrentSession({ code, campaignId: idCampaign }));
                dispatch(setSessionStatus(session.status));
                dispatch(setSessionExpiresAt(session.expiresAt));
            } catch {
                if (cancelled) return;
                redirectAfterUnavailableSession();
                setIsLoading(false);
                return;
            }

            try {
                await sessionService.joinSession(code);
                if (cancelled) return;
                if (!isAlreadyInSession) {
                    toast.success(t("toast.connectionSuccess"));
                }
            } catch (error: unknown) {
                if (cancelled) return;
                const message =
                    error && typeof error === "object" && "response" in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                if (isSessionUnavailableMessage(message)) {
                    redirectAfterUnavailableSession();
                    setIsLoading(false);
                    return;
                }
                // Session déjà rejointe ou erreur non bloquante
            }

            if (!campaign?.label) {
                const label = await campaignService.getCampaignLabel(idCampaign);
                if (label) setCampaignLabel(label);
            }

            try {
                const data = await sessionService.getParticipants(code);
                setParticipants(data.participants);

                dispatch(pruneSessionParticipantDisplayNames());
                await loadParticipantProfiles(data.participants.map((p) => p.userId));

                const characterIds = data.participants.map((p) => p.characterId).filter(Boolean) as string[];
                await fetchCharacterDetails(characterIds);
            } catch {
                toast.error(t("toast.participantsError"));
            }

            try {
                const res = await characterService.getPlayersWithoutGroup(1, 100);
                setFetchedMyCharacters(res.data);
                void loadCompanionCountsForPlayers(
                    res.data.map((character) => character._id),
                    (ids) => characterService.getNpcsByLinkedPlayers(ids),
                ).then((counts) => {
                    if (!cancelled) setCompanionCountByCharacterId(counts);
                });
            } catch {
                // silently fail
            }
            if (!cancelled) {
                setIsLoading(false);
            }
        };
        init();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const getCharacterLabel = (characterId: string | null): string => {
        if (!characterId) return "";
        return resolveSessionCharacterLabel(characterDetails[characterId]);
    };

    return {
        campaignLabel,
        locale,
        participants,
        setParticipants,
        participantNames,
        participantAvatars,
        characterDetails,
        myCharacters,
        companionCountByCharacterId,
        fetchCharacterDetails,
        getCharacterLabel,
        isLoading,
    };
}
