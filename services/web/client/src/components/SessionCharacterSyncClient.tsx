"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    selectIsInSession,
    selectSessionCode,
    selectSessionCampaignId,
    selectSessionParticipants,
    clearCurrentSession,
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
import {
    registerLocalCharacterSheetUpdatedListener,
    registerSessionRosterHttpSyncScheduler,
    registerSessionSyncSocket,
    requestSessionRosterHttpSync,
} from "@/lib/sessionCharacterSyncBridge";
import { shouldNotifyPlayerOfGmCharacterSheetUpdate } from "@/lib/shouldNotifyPlayerOfGmCharacterSheetUpdate";
import { setSessionSnapshotForBroadcast } from "@/lib/sessionSnapshot";
import {
    acquireSessionSocket,
    destroySessionSocket,
    getPooledSessionSocket,
    releaseSessionSocket,
    shouldShowSessionEndNotice,
} from "@/lib/sessionSocketPool";
import { mergeParticipantsPreserveCharacterIds } from "@/lib/sessionParticipantMerge";
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
 * joined / change-character mettent toujours à jour Redux (sidebar). Les toasts déconnexion / départ
 * restent hors lobby pour éviter les doublons avec la page session.
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
    const hasProcessedSessionEndRef = useRef(false);

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

    useEffect(() => {
        if (isInSession && code) {
            hasProcessedSessionEndRef.current = false;
        }
    }, [isInSession, code]);

    const isCurrentUserGameMaster = useEffectEvent(() => {
        const userId = userIdRef.current;
        if (!userId) return false;
        return participantsRef.current.some((participant) => participant.userId === userId && participant.status === "gameMaster");
    });

    const endSessionLocally = useEffectEvent(() => {
        if (hasProcessedSessionEndRef.current) return;
        hasProcessedSessionEndRef.current = true;
        destroySessionSocket();
        dispatch(clearCurrentSession());

        const path = pathnameRef.current;
        const locale = path.split("/")[1] || "fr";
        routerRef.current.push(`/${locale}/welcome`);
    });

    const shouldConnect = Boolean(isInSession && code && token);

    useEffect(() => {
        setSessionSnapshotForBroadcast(isInSession && code ? { code, isInSession: true } : null);
    }, [isInSession, code]);

    /** FR-014 — le MJ n'est pas notifié par WS de ses propres sauvegardes (gateway `client.to`). */
    useEffect(() => {
        if (!isInSession) {
            registerLocalCharacterSheetUpdatedListener(null);
            return;
        }
        registerLocalCharacterSheetUpdatedListener((characterId) => {
            const cid = characterId.trim();
            if (cid) {
                dispatch(touchRemoteCharacterSheet(cid));
            }
        });
        return () => registerLocalCharacterSheetUpdatedListener(null);
    }, [dispatch, isInSession]);

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
                        const prev = participantsRef.current;
                        const merged = mergeParticipantsPreserveCharacterIds(prev, d.participants);
                        dispatch(setSessionParticipants(merged));
                    })
                    .catch(() => {});
            }, ROSTER_HTTP_SYNC_DEBOUNCE_MS);
        };

        registerSessionRosterHttpSyncScheduler(scheduleRosterHttpSync);

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

        const onSessionEnded = (reason: "closed" | "expired") => {
            const sessionCode = codeRef.current;
            if (sessionCode && shouldShowSessionEndNotice(sessionCode, reason)) {
                const isGameMaster = isCurrentUserGameMaster();
                const toastKey =
                    reason === "expired"
                        ? "sessionEnded.description.expired"
                        : isGameMaster
                          ? "toast.sessionClosedBySelf"
                          : "sessionEnded.description.closed";
                toastRef.current.info(tRef.current(toastKey));
            }
            endSessionLocally();
        };

        const onSessionClosed = () => onSessionEnded("closed");
        const onSessionExpired = () => onSessionEnded("expired");

        socket.on("connect", onConnect);
        socket.on("session:launched", onSessionLaunched);
        socket.on("session:closed", onSessionClosed);
        socket.on("session:expired", onSessionExpired);
        if (socket.connected) {
            onConnect();
        }

        registerSessionSyncSocket(socket);

        return () => {
            registerSessionRosterHttpSyncScheduler(null);
            if (rosterSyncTimer !== null) {
                clearTimeout(rosterSyncTimer);
            }
            socket.off("connect", onConnect);
            socket.off("session:launched", onSessionLaunched);
            socket.off("session:closed", onSessionClosed);
            socket.off("session:expired", onSessionExpired);
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
            const joinedCid = payload.characterId?.trim();
            if (joinedCid) {
                dispatch(touchRemoteCharacterSheet(joinedCid));
            }
            requestSessionRosterHttpSync();
        };

        const onParticipantCharacterChanged = (payload: { userId: string; characterId: string }) => {
            const list = participantsRef.current;
            const sessionCode = codeRef.current;
            if (!sessionCode) return;
            const exists = list.some((p) => p.userId === payload.userId);
            const next: SessionParticipant[] = exists
                ? list.map((p) =>
                      p.userId === payload.userId ? { ...p, characterId: payload.characterId } : p,
                  )
                : [
                      ...list,
                      {
                          id: payload.userId,
                          userId: payload.userId,
                          characterId: payload.characterId,
                          status: "connected" as const,
                          joinedAt: new Date().toISOString(),
                          sessionId: sessionCode,
                      },
                  ];
            dispatch(setSessionParticipants(next));
            const changedCid = payload.characterId?.trim();
            if (changedCid) {
                dispatch(touchRemoteCharacterSheet(changedCid));
            }
            requestSessionRosterHttpSync();
        };

        socket.on("session:participant-joined", onParticipantJoined);
        socket.on("session:participant-character-changed", onParticipantCharacterChanged);

        let onSheetUpdated: ((payload: { characterId: string }) => void) | undefined;
        let onParticipantDisconnected:
            | ((payload: { userId: string; username?: string }) => void)
            | undefined;
        let onParticipantLeft:
            | ((payload: {
                  userId: string;
                  username?: string;
                  characterId?: string | null;
              }) => void)
            | undefined;

        if (!isOnSessionLobbyPage) {
            onSheetUpdated = ({ characterId }: { characterId: string }) => {
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

            onParticipantDisconnected = ({
                userId,
                username,
            }: {
                userId: string;
                username?: string;
            }) => {
                if (userId === userIdRef.current) return;
                const list = participantsRef.current;
                const next = list.map((p) =>
                    p.userId === userId ? { ...p, status: "disconnected" as const } : p,
                );
                dispatch(setSessionParticipants(next));
                const label = username?.trim() || userId;
                toastRef.current.info(tRef.current("toast.participantDisconnected", { username: label }));
            };

            onParticipantLeft = (payload: {
                userId: string;
                username?: string;
                characterId?: string | null;
            }) => {
                dispatch(removeSessionParticipantByUserId(payload.userId));

                const myId = userIdRef.current;
                const amGm = myId
                    ? participantsRef.current.some((p) => p.userId === myId && p.status === "gameMaster")
                    : false;
                const leftCharId = payload.characterId?.trim() ?? "";
                const viewing = extractCharacterIdFromSessionContextPath(pathnameRef.current);
                const gmViewingDepartedCharacter = Boolean(amGm && leftCharId && viewing === leftCharId);

                if (payload.userId !== myId) {
                    if (gmViewingDepartedCharacter) {
                        toastRef.current.info(tRef.current("toast.participantLeftViewingCharacter"));
                    } else {
                        const label = payload.username?.trim() || payload.userId;
                        toastRef.current.info(tRef.current("toast.participantLeftSession", { username: label }));
                    }
                }

                if (!myId) return;
                if (!amGm || !leftCharId) return;
                if (viewing !== leftCharId) return;

                const path = pathnameRef.current;
                const locale = path.split("/")[1] || "fr";
                const camp = campaignIdRef.current;
                const sessionCode = codeRef.current;
                if (camp && sessionCode) {
                    routerRef.current.push(`/${locale}/campaigns/${camp}/session/${sessionCode}`);
                } else {
                    routerRef.current.push(`/${locale}/welcome`);
                }
            };

            socket.on("session:character-sheet-updated", onSheetUpdated);
            socket.on("session:participant-left", onParticipantLeft);
            socket.on("session:participant-disconnected", onParticipantDisconnected);
        }

        return () => {
            socket.off("session:participant-joined", onParticipantJoined);
            socket.off("session:participant-character-changed", onParticipantCharacterChanged);
            if (onSheetUpdated) socket.off("session:character-sheet-updated", onSheetUpdated);
            if (onParticipantLeft) socket.off("session:participant-left", onParticipantLeft);
            if (onParticipantDisconnected) socket.off("session:participant-disconnected", onParticipantDisconnected);
        };
    }, [shouldConnect, code, token, isOnSessionLobbyPage, dispatch]);

    return null;
}
