"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    selectIsInSession,
    selectSessionCode,
    selectSessionCampaignId,
    selectSessionParticipants,
    removeSessionParticipantByUserId,
    setSessionParticipants,
    setSessionExpiresAt,
    setSessionStatus,
    touchRemoteCharacterSheet,
} from "@/store/slices/sessionSlice";
import sessionService, {
    type ParticipantStatus,
    type SessionParticipant,
    mapParticipantsFromSessionLaunchedPayload,
    parseExpiresAtFromLaunchedPayload,
} from "@/services/SessionService";
import { selectUser } from "@/store/slices/userSlice";
import { registerSessionSyncSocket } from "@/lib/sessionCharacterSyncBridge";
import { shouldNotifyPlayerOfGmCharacterSheetUpdate } from "@/lib/shouldNotifyPlayerOfGmCharacterSheetUpdate";
import { setSessionSnapshotForBroadcast } from "@/lib/sessionSnapshot";
import {
    acquireSessionSocket,
    getPooledSessionSocket,
    releaseSessionSocket,
} from "@/lib/sessionSocketPool";
import { useToast } from "@/hooks/useToast";

/** Évite les rafales HTTP lors des reconnexions Socket.IO rapprochées. */
const ROSTER_HTTP_SYNC_DEBOUNCE_MS = 600;

/**
 * ID personnage affiché sur les routes fiche en contexte session (hors /characters/new/...).
 */
function extractCharacterIdFromSessionContextPath(pathname: string): string | null {
    const direct = pathname.match(/\/characters\/([^/?]+)/);
    if (direct && direct[1] !== "new") return direct[1];
    const fromGroup = pathname.match(/\/campaigns\/[^/]+\/groups\/[^/]+\/characters\/([^/?]+)/);
    if (fromGroup && fromGroup[1] !== "new") return fromGroup[1];
    return null;
}

/**
 * Une connexion WebSocket partagée (voir `sessionSocketPool`) pour la session en cours,
 * y compris sur la page lobby : évite une seconde connexion et une reconnexion à chaque navigation.
 * Les événements chevauchants avec la page session ne sont branchés que hors lobby (cf. second effet).
 */
export default function SessionCharacterSyncClient() {
    const pathname = usePathname();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const dispatch = useAppDispatch();
    const { token } = useKeycloak();
    const isInSession = useAppSelector(selectIsInSession);
    const code = useAppSelector(selectSessionCode);
    const campaignId = useAppSelector(selectSessionCampaignId);
    const participants = useAppSelector(selectSessionParticipants);
    const user = useAppSelector(selectUser);

    const participantsRef = useRef(participants);
    const userIdRef = useRef(user?.keycloakId);
    const pathnameRef = useRef(pathname ?? "");
    const campaignIdRef = useRef(campaignId);
    const codeRef = useRef(code);
    const toastRef = useRef(toast);
    const routerRef = useRef(router);
    const tRef = useRef(t);

    useEffect(() => {
        participantsRef.current = participants;
        userIdRef.current = user?.keycloakId;
        pathnameRef.current = pathname ?? "";
        campaignIdRef.current = campaignId;
        codeRef.current = code;
        toastRef.current = toast;
        routerRef.current = router;
        tRef.current = t;
    }, [participants, user?.keycloakId, pathname, campaignId, code, toast, router, t]);

    const shouldConnect = Boolean(isInSession && code && token);

    useEffect(() => {
        setSessionSnapshotForBroadcast(isInSession && code ? { code, isInSession: true } : null);
    }, [isInSession, code]);

    useEffect(() => {
        if (!shouldConnect || !code || !token) {
            return;
        }

        const socket = acquireSessionSocket(code, token);
        let rosterSyncTimer: ReturnType<typeof setTimeout> | null = null;

        const scheduleRosterHttpSync = () => {
            if (rosterSyncTimer !== null) {
                clearTimeout(rosterSyncTimer);
            }
            rosterSyncTimer = setTimeout(() => {
                rosterSyncTimer = null;
                void sessionService
                    .getParticipants(code)
                    .then((d) => {
                        dispatch(setSessionParticipants(d.participants));
                    })
                    .catch(() => {});
            }, ROSTER_HTTP_SYNC_DEBOUNCE_MS);
        };

        const onConnect = () => {
            const my = participantsRef.current.find((p) => p.userId === userIdRef.current);
            socket.emit("session:join", {
                sessionId: code,
                characterId: my?.characterId ?? null,
            });
            scheduleRosterHttpSync();
        };

        const onSessionLaunched = (payload?: {
            session?: { participants?: unknown; expiresAt?: unknown };
            expiresAt?: unknown;
        }) => {
            dispatch(setSessionStatus("launched"));
            const exp =
                parseExpiresAtFromLaunchedPayload(payload?.expiresAt) ??
                parseExpiresAtFromLaunchedPayload(payload?.session?.expiresAt);
            if (exp != null) {
                dispatch(setSessionExpiresAt(exp));
            }
            const rawList = payload?.session?.participants;
            if (Array.isArray(rawList)) {
                dispatch(
                    setSessionParticipants(
                        mapParticipantsFromSessionLaunchedPayload(rawList, code),
                    ),
                );
            }
            scheduleRosterHttpSync();
        };

        socket.on("connect", onConnect);
        socket.on("session:launched", onSessionLaunched);
        if (socket.connected) {
            onConnect();
        }

        registerSessionSyncSocket(socket);

        return () => {
            if (rosterSyncTimer !== null) {
                clearTimeout(rosterSyncTimer);
            }
            socket.off("connect", onConnect);
            socket.off("session:launched", onSessionLaunched);
            registerSessionSyncSocket(null);
            releaseSessionSocket();
        };
    }, [shouldConnect, code, token, dispatch]);

    const isOnSessionLobbyPage = /\/campaigns\/[^/]+\/session\/[^/]+(?:\/|$)/.test(pathname ?? "");

    useEffect(() => {
        if (!shouldConnect || !code || !token) {
            return;
        }

        const socket = getPooledSessionSocket();
        if (!socket) {
            return;
        }

        if (isOnSessionLobbyPage) {
            return;
        }

        const onParticipantJoined = (payload: {
            userId: string;
            username: string;
            characterId: string | null;
            status: ParticipantStatus | string;
        }) => {
            const list = participantsRef.current;
            const sessionCode = codeRef.current;
            if (!sessionCode) return;
            const exists = list.some((p) => p.userId === payload.userId);
            const status = (payload.status as ParticipantStatus) || "connected";
            let next: SessionParticipant[];
            if (exists) {
                next = list.map((p) =>
                    p.userId === payload.userId
                        ? {
                              ...p,
                              status,
                              characterId: payload.characterId ?? p.characterId,
                          }
                        : p,
                );
            } else {
                next = [
                    ...list,
                    {
                        id: payload.userId,
                        userId: payload.userId,
                        characterId: payload.characterId ?? null,
                        status,
                        joinedAt: new Date().toISOString(),
                        sessionId: sessionCode,
                    },
                ];
            }
            dispatch(setSessionParticipants(next));
        };

        const onParticipantCharacterChanged = (payload: { userId: string; characterId: string }) => {
            const list = participantsRef.current;
            const next = list.map((p) =>
                p.userId === payload.userId ? { ...p, characterId: payload.characterId } : p,
            );
            dispatch(setSessionParticipants(next));
        };

        const onSheetUpdated = ({ characterId }: { characterId: string }) => {
            if (!characterId) return;
            dispatch(touchRemoteCharacterSheet(characterId));
            if (
                shouldNotifyPlayerOfGmCharacterSheetUpdate(
                    characterId,
                    userIdRef.current,
                    participantsRef.current,
                )
            ) {
                toastRef.current.info(tRef.current("toast.sheetEditedByGm"));
            }
        };

        const onParticipantLeft = (payload: { userId: string; characterId?: string | null }) => {
            dispatch(removeSessionParticipantByUserId(payload.userId));

            const myId = userIdRef.current;
            if (!myId) return;
            const amGm = participantsRef.current.some(
                (p) => p.userId === myId && p.status === "gameMaster",
            );
            const leftCharId = payload.characterId?.trim() ?? "";
            if (!amGm || !leftCharId) return;

            const viewing = extractCharacterIdFromSessionContextPath(pathnameRef.current);
            if (viewing !== leftCharId) return;

            const path = pathnameRef.current;
            const locale = path.split("/")[1] || "fr";
            const camp = campaignIdRef.current;
            const sessionCode = codeRef.current;
            toastRef.current.info(tRef.current("toast.participantLeftViewingCharacter"));
            if (camp && sessionCode) {
                routerRef.current.push(`/${locale}/campaigns/${camp}/session/${sessionCode}`);
            } else {
                routerRef.current.push(`/${locale}/welcome`);
            }
        };

        socket.on("session:participant-joined", onParticipantJoined);
        socket.on("session:participant-character-changed", onParticipantCharacterChanged);
        socket.on("session:character-sheet-updated", onSheetUpdated);
        socket.on("session:participant-left", onParticipantLeft);

        return () => {
            socket.off("session:participant-joined", onParticipantJoined);
            socket.off("session:participant-character-changed", onParticipantCharacterChanged);
            socket.off("session:character-sheet-updated", onSheetUpdated);
            socket.off("session:participant-left", onParticipantLeft);
        };
    }, [shouldConnect, code, token, isOnSessionLobbyPage, dispatch]);

    return null;
}
