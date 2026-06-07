"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { registerRemoteCharacterSheetUpdatedListener } from "@/lib/sessionCharacterSyncBridge";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import campaignService from "@/services/CampaignService";
import characterService from "@/services/CharacterService";
import sessionService, { type SessionParticipant } from "@/services/SessionService";
import { fetchSessionParticipantDisplayName } from "@/lib/sessionParticipantDisplayNames";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    clearCurrentSession,
    setCurrentSession,
    setSessionStatus,
    setSessionExpiresAt,
    selectSessionParticipantDisplayNames,
    mergeSessionParticipantDisplayNames,
    pruneSessionParticipantDisplayNames,
} from "@/store/slices/sessionSlice";
import { isSessionUnavailableMessage } from "@/lib/sessionUnavailableError";
import { useToast } from "@/hooks/useToast";
import type { Character } from "@/types/character";
import type { Campaign } from "@/types/campaign";

interface UseSessionDataOptions {
    code: string;
    idCampaign: string;
    campaign: Campaign | undefined;
}

export function useSessionData({ code, idCampaign, campaign }: UseSessionDataOptions): {
    campaignLabel: string | null;
    locale: string;
    participants: SessionParticipant[];
    setParticipants: React.Dispatch<React.SetStateAction<SessionParticipant[]>>;
    participantNames: Record<string, string>;
    characterDetails: Record<string, Character>;
    myCharacters: Character[];
    fetchCharacterDetails: (ids: string[]) => Promise<void>;
    getCharacterLabel: (characterId: string | null) => string;
    isLoading: boolean;
} {

    const dispatch = useAppDispatch();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const participantNames = useAppSelector(selectSessionParticipantDisplayNames);

    const [campaignLabel, setCampaignLabel] = useState<string | null>(null);
    const [participants, setParticipants] = useState<SessionParticipant[]>([]);
    const [characterDetails, setCharacterDetails] = useState<Record<string, Character>>({});
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /** Toujours à jour : les handlers WebSocket gardent une ref stable (voir `useSessionSocket` deps `[token]`). */
    const characterDetailsRef = useRef<Record<string, Character>>({});
    characterDetailsRef.current = characterDetails;

    const fetchCharacterDetails = useCallback(async (ids: string[]) => {
        const targets = ids.filter((id) => Boolean(id?.trim()));
        if (targets.length === 0) return;
        const results = await Promise.allSettled(
            targets.map((id) => characterService.getCharacterById(id, { sessionCode: code })),
        );
        setCharacterDetails((prev) => {
            const next = { ...prev };
            results.forEach((result, i) => {
                if (result.status === "fulfilled") {
                    next[targets[i]] = result.value;
                }
            });
            return next;
        });
    }, [code]);

    useEffect(() => {
        registerRemoteCharacterSheetUpdatedListener((characterId) => {
            void fetchCharacterDetails([characterId]);
        });
        return () => registerRemoteCharacterSheetUpdatedListener(null);
    }, [fetchCharacterDetails]);

    useEffect(() => {
        let cancelled = false;

        const redirectToWelcomeAfterUnavailableSession = () => {
            dispatch(clearCurrentSession());
            toast.info(t("toast.sessionNotFound"));
            router.push(`/${locale}/welcome`);
        };

        const init = async () => {
            try {
                const session = await sessionService.getSession(code);
                if (cancelled) return;

                dispatch(setCurrentSession({ code, campaignId: idCampaign }));
                dispatch(setSessionStatus(session.status));
                dispatch(setSessionExpiresAt(session.expiresAt));
            } catch {
                if (cancelled) return;
                redirectToWelcomeAfterUnavailableSession();
                setIsLoading(false);
                return;
            }

            try {
                await sessionService.joinSession(code);
                if (cancelled) return;
                toast.success(t("toast.connectionSuccess"));
            } catch (error: unknown) {
                if (cancelled) return;
                const message =
                    error && typeof error === "object" && "response" in error
                        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                        : undefined;
                if (isSessionUnavailableMessage(message)) {
                    redirectToWelcomeAfterUnavailableSession();
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
                const nameEntries = await Promise.all(
                    data.participants.map(async (p) => {
                        const label = await fetchSessionParticipantDisplayName(p.userId);
                        return [p.userId, label] as const;
                    }),
                );
                const resolvedNames = Object.fromEntries(
                    nameEntries.filter(([, label]) => label !== SESSION_PARTICIPANT_NAME_LOADING),
                );
                if (Object.keys(resolvedNames).length > 0) {
                    dispatch(mergeSessionParticipantDisplayNames(resolvedNames));
                }

                const characterIds = data.participants.map((p) => p.characterId).filter(Boolean) as string[];
                await fetchCharacterDetails(characterIds);
            } catch {
                toast.error(t("toast.participantsError"));
            }

            try {
                const res = await characterService.getPlayersWithoutGroup(1, 100);
                setMyCharacters(res.data);
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
        const character = characterDetails[characterId];
        if (!character) return characterId;
        let label = character.firstname.trim();
        if (character.lastname) label += ` ${character.lastname.trim()}`;
        return label;
    };

    return {
        campaignLabel,
        locale,
        participants,
        setParticipants,
        participantNames,
        characterDetails,
        myCharacters,
        fetchCharacterDetails,
        getCharacterLabel,
        isLoading,
    };
}
