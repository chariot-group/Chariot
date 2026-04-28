"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import campaignService from "@/services/CampaignService";
import characterService from "@/services/CharacterService";
import sessionService, { type SessionParticipant } from "@/services/SessionService";
import UserService from "@/services/UserService";
import { useAppDispatch } from "@/store/hooks";
import { setCurrentSession, setSessionStatus, setSessionExpiresAt } from "@/store/slices/sessionSlice";
import { useToast } from "@/hooks/useToast";
import type { Character } from "@/types/character";
import type { Campaign } from "@/types/campaign";

interface UseSessionDataOptions {
    code: string;
    idCampaign: string;
    campaign: Campaign | undefined;
}

export function useSessionData({ code, idCampaign, campaign }: UseSessionDataOptions) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const [campaignLabel, setCampaignLabel] = useState<string | null>(null);
    const [participants, setParticipants] = useState<SessionParticipant[]>([]);
    const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
    const [characterDetails, setCharacterDetails] = useState<Record<string, Character>>({});
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);

    const fetchCharacterDetails = async (ids: string[]) => {
        const missing = ids.filter((id) => id && !characterDetails[id]);
        if (missing.length === 0) return;
        const results = await Promise.allSettled(missing.map((id) => characterService.getCharacterById(id)));
        setCharacterDetails((prev) => {
            const next = { ...prev };
            results.forEach((result, i) => {
                if (result.status === "fulfilled") {
                    next[missing[i]] = result.value;
                }
            });
            return next;
        });
    };

    useEffect(() => {
        const init = async () => {
            try {
                const session = await sessionService.getSession(code);
                dispatch(setCurrentSession({ code, campaignId: idCampaign }));
                dispatch(setSessionStatus(session.status));
                dispatch(setSessionExpiresAt(session.expiresAt));
            } catch {
                toast.info(t("toast.sessionNotFound"));
                router.back();
                return;
            }

            try {
                await sessionService.joinSession(code);
            } catch {
                // Session déjà rejointe ou erreur non bloquante
            }

            if (!campaign?.label) {
                const label = await campaignService.getCampaignLabel(idCampaign);
                if (label) setCampaignLabel(label);
            }

            try {
                const data = await sessionService.getParticipants(code);
                setParticipants(data.participants);
                toast.success(t("toast.connectionSuccess"));

                const names = await Promise.all(
                    data.participants.map(async (p) => {
                        try {
                            const user = await UserService.getUserById(p.userId);
                            return [p.userId, `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username] as const;
                        } catch {
                            return [p.userId, p.userId] as const;
                        }
                    }),
                );
                setParticipantNames(Object.fromEntries(names));

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
        };

        init();
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
        setParticipantNames,
        characterDetails,
        myCharacters,
        fetchCharacterDetails,
        getCharacterLabel,
    };
}
