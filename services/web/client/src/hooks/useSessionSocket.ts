"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { type Socket } from "socket.io-client";
import sessionService, {
    type SessionParticipant,
    mapParticipantsFromSessionLaunchedPayload,
    parseExpiresAtFromLaunchedPayload,
} from "@/services/SessionService";
import UserService from "@/services/UserService";
import {
    formatSessionParticipantLabelFromWsUsername,
    formatSessionParticipantUserLabel,
} from "@/lib/formatSessionParticipantUserLabel";
import {
    fetchSessionParticipantDisplayName,
    resolveParticipantToastLabel,
} from "@/lib/sessionParticipantDisplayNames";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import { useAppDispatch, useAppStore } from "@/store/hooks";
import {
    clearCurrentSession,
    mergeSessionParticipantDisplayNames,
    selectSessionParticipants,
    setSessionParticipants,
    setSessionStatus,
    setSessionExpiresAt,
    setSessionTokensByUser,
    touchRemoteCharacterSheet,
} from "@/store/slices/sessionSlice";
import { useToast } from "@/hooks/useToast";
import {
    acquireSessionSocket,
    destroySessionSocket,
    releaseSessionSocket,
    shouldShowSessionEndNotice,
} from "@/lib/sessionSocketPool";
import { removePlayerFromCampaignGroupsOnSessionLeave } from "@/lib/removePlayerFromCampaignGroupsOnSessionLeave";
import { requestSessionRosterHttpSync } from "@/lib/sessionCharacterSyncBridge";
import { invalidateCache as invalidateGroupCache } from "@/store/slices/groupSlice";
import { mergeParticipantsPreserveCharacterIds } from "@/lib/sessionParticipantMerge";
import { setContextMode } from "@/store/slices/environmentSlice";
import NavigationService from "@/services/NavigationService";

interface UseSessionSocketOptions {
    token: string | null | undefined;
    code: string;
    /** Campagne de la session : utilisée pour retirer le joueur des groupes de cette campagne à la sortie. */
    campaignId?: string;
    campaignName: string;
    currentUser: { keycloakId: string; balance: number } | null | undefined;
    participants: SessionParticipant[];
    setParticipants: React.Dispatch<React.SetStateAction<SessionParticipant[]>>;
    fetchCharacterDetails: (ids: string[]) => Promise<void>;
    tokensByUser: Record<string, number>;
    setTokensByUser: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useSessionSocket({
    token,
    code,
    campaignId,
    campaignName,
    currentUser,
    participants,
    setParticipants,
    fetchCharacterDetails,
    tokensByUser,
    setTokensByUser,
}: UseSessionSocketOptions) {
    const dispatch = useAppDispatch();
    const appStore = useAppStore();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const socketRef = useRef<Socket | null>(null);
    const participantsRef = useRef(participants);
    const tokensByUserRef = useRef(tokensByUser);
    const campaignNameRef = useRef(campaignName);
    const currentUserRef = useRef(currentUser);
    const localeRef = useRef(locale);
    const routerRef = useRef(router);
    const toastRef = useRef(toast);
    const tRef = useRef(t);
    const setParticipantsRef = useRef(setParticipants);
    const setTokensByUserRef = useRef(setTokensByUser);
    const hasProcessedSessionEndRef = useRef(false);
    const [isChangingCharacter, setIsChangingCharacter] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [sessionEndReason, setSessionEndReason] = useState<'closed' | 'expired' | null>(null);

    // Keep refs in sync so handlers always see the latest values
    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    useEffect(() => {
        tokensByUserRef.current = tokensByUser;
    }, [tokensByUser]);

    useEffect(() => {
        campaignNameRef.current = campaignName;
    }, [campaignName]);

    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    useEffect(() => {
        localeRef.current = locale;
        routerRef.current = router;
        toastRef.current = toast;
        tRef.current = t;
        setParticipantsRef.current = setParticipants;
        setTokensByUserRef.current = setTokensByUser;
    }, [locale, router, toast, t, setParticipants, setTokensByUser]);

    useEffect(() => {
        hasProcessedSessionEndRef.current = false;
    }, [code]);

    const isCurrentUserGameMaster = useEffectEvent(() => {
        const userId = currentUserRef.current?.keycloakId;
        if (!userId) return false;
        return participantsRef.current.some((participant) => participant.userId === userId && participant.status === "gameMaster");
    });

    const endSessionLocally = useEffectEvent((reason: "closed" | "expired") => {
        if (hasProcessedSessionEndRef.current) return;
        hasProcessedSessionEndRef.current = true;
        const isGameMaster = isCurrentUserGameMaster();
        if (shouldShowSessionEndNotice(code, reason)) {
            const toastKey =
                reason === "expired"
                    ? "sessionEnded.description.expired"
                    : isGameMaster
                        ? "toast.sessionClosedBySelf"
                        : "sessionEnded.description.closed";
            toastRef.current.info(tRef.current(toastKey));
        }
        setSessionEndReason(reason);
        setIsChangingCharacter(false);
        setIsLeaving(false);
        setIsLaunching(false);
        destroySessionSocket();
        socketRef.current = null;
        dispatch(clearCurrentSession());
        routerRef.current.push(`/${localeRef.current}/welcome`);
    });

    // Sync session state to Redux — fusion avec le store pour ne pas écraser les MAJ WS/layout (sidebar MJ).
    useEffect(() => {
        const fromRedux = selectSessionParticipants(appStore.getState());
        const merged = mergeParticipantsPreserveCharacterIds(fromRedux, participants);
        dispatch(setSessionParticipants(merged));
    }, [participants, dispatch, appStore]);

    useEffect(() => {
        dispatch(setSessionTokensByUser(tokensByUser));
    }, [tokensByUser, dispatch]);

    useEffect(() => {
        if (!token) return;

        console.info("Attaching to shared session WebSocket pool");

        const socket = acquireSessionSocket(code, token);

        socketRef.current = socket;

        const onParticipantCharacterChanged = ({
            userId,
            characterId,
        }: {
            userId: string;
            characterId: string;
        }) => {
            setParticipantsRef.current((prev) => {
                const exists = prev.some((p) => p.userId === userId);
                if (exists) {
                    return prev.map((p) => (p.userId === userId ? { ...p, characterId } : p));
                }
                return [
                    ...prev,
                    {
                        id: userId,
                        userId,
                        characterId,
                        status: "connected" as const,
                        joinedAt: new Date().toISOString(),
                        sessionId: code,
                    },
                ];
            });
            fetchCharacterDetails([characterId]);
            const cidTrim = typeof characterId === "string" ? characterId.trim() : "";
            if (cidTrim) {
                dispatch(touchRemoteCharacterSheet(cidTrim));
            }
            requestSessionRosterHttpSync();
        };

        const onParticipantJoined = async ({
            userId,
            username,
            characterId,
            status,
        }: {
            userId: string;
            username: string;
            characterId: string;
            status: "connected" | "gameMaster" | "disconnected";
        }) => {
            setParticipantsRef.current((prev) => {
                const exists = prev.some((p) => p.userId === userId);
                if (exists) {
                    return prev.map((p) =>
                        p.userId === userId
                            ? { ...p, status: status ?? "connected", characterId: characterId ?? p.characterId }
                            : p,
                    );
                }
                return [
                    ...prev,
                    {
                        id: userId,
                        userId,
                        characterId: characterId ?? null,
                        status: status ?? ("connected" as const),
                        joinedAt: new Date().toISOString(),
                        sessionId: code,
                    },
                ];
            });
            const wsLabel = formatSessionParticipantLabelFromWsUsername(username);
            if (wsLabel) {
                dispatch(mergeSessionParticipantDisplayNames({ [userId]: wsLabel }));
            }
            try {
                const user = await UserService.getUserById(userId);
                const apiLabel = formatSessionParticipantUserLabel(user);
                if (apiLabel) {
                    dispatch(mergeSessionParticipantDisplayNames({ [userId]: apiLabel }));
                }
            } catch {
                // Le libellé WS ou un fetch ultérieur complètera le store.
            }
            if (characterId) {
                fetchCharacterDetails([characterId]);
                const jc = typeof characterId === "string" ? characterId.trim() : "";
                if (jc) {
                    dispatch(touchRemoteCharacterSheet(jc));
                }
            }
            requestSessionRosterHttpSync();
        };

        const onParticipantLeft = ({
            userId,
            username,
        }: {
            userId: string;
            username?: string;
            characterId?: string | null;
        }) => {
            if (userId === currentUserRef.current?.keycloakId) return;
            setParticipantsRef.current((prev) => prev.filter((p) => p.userId !== userId));
            const label = resolveParticipantToastLabel(appStore.getState(), userId, username);
            toastRef.current.info(tRef.current("toast.participantLeftSession", { username: label }));
        };

        const onParticipantDisconnected = ({
            userId,
            username,
        }: {
            userId: string;
            username?: string;
        }) => {
            if (userId === currentUserRef.current?.keycloakId) return;
            setParticipantsRef.current((prev) =>
                prev.map((p) => (p.userId === userId ? { ...p, status: "disconnected" as const } : p)),
            );
            const label = resolveParticipantToastLabel(appStore.getState(), userId, username);
            toastRef.current.info(tRef.current("toast.participantDisconnected", { username: label }));
        };

        const onSessionExpired = () => {
            endSessionLocally("expired");
        };

        const onSessionClosed = () => {
            endSessionLocally("closed");
        };

        const onTokenUpdated = ({ tokensByUser: updatedTokens }: { tokensByUser: Record<string, number> }) => {
            setTokensByUserRef.current(updatedTokens);
        };

        const onSessionLaunched = async (payload?: {
            session?: { participants?: unknown; expiresAt?: unknown };
            expiresAt?: unknown;
        }) => {
            dispatch(setSessionStatus("launched"));
            const exp =
                parseExpiresAtFromLaunchedPayload(payload?.expiresAt) ??
                parseExpiresAtFromLaunchedPayload(payload?.session?.expiresAt);
            if (exp != null) {
                dispatch(setSessionExpiresAt(exp));
            } else {
                try {
                    const session = await sessionService.getSession(code);
                    dispatch(setSessionExpiresAt(session.expiresAt));
                } catch {
                    // Non-blocking: timer won't display if fetch fails
                }
            }
            const userId = currentUserRef.current?.keycloakId;
            const myParticipantBefore =
                userId != null ? participantsRef.current.find((p) => p.userId === userId) : undefined;

            const rawList = payload?.session?.participants;
            const mappedParticipants = Array.isArray(rawList)
                ? mapParticipantsFromSessionLaunchedPayload(rawList, code)
                : null;
            if (mappedParticipants) {
                setParticipantsRef.current(mappedParticipants);
                void (async () => {
                    const nameUpdates: Record<string, string> = {};
                    for (const participant of mappedParticipants) {
                        const label = await fetchSessionParticipantDisplayName(participant.userId);
                        if (label !== SESSION_PARTICIPANT_NAME_LOADING) {
                            nameUpdates[participant.userId] = label;
                        }
                    }
                    if (Object.keys(nameUpdates).length > 0) {
                        dispatch(mergeSessionParticipantDisplayNames(nameUpdates));
                    }
                })();
            }

            toastRef.current.success(tRef.current("toast.sessionLaunched"));

            const myTokens = userId ? (tokensByUserRef.current[userId] ?? 0) : 0;
            if (userId && myTokens >= 1) {
                try {
                    await UserService.addHistory(campaignNameRef.current, myTokens);
                } catch {
                    // history update failure should not block navigation
                }
            }

            const charIdForNav =
                myParticipantBefore?.characterId ??
                (userId != null ? mappedParticipants?.find((p) => p.userId === userId)?.characterId : undefined);

            if (myParticipantBefore?.status === "gameMaster") {
                dispatch(setContextMode("gm"));
                if (campaignId) {
                    const destination = await NavigationService.determineSpaceDestination(campaignId, localeRef.current);
                    routerRef.current.push(destination.path);
                    return;
                }
            }

            dispatch(setContextMode("player"));

            if (charIdForNav) {
                routerRef.current.push(`/${localeRef.current}/characters/${charIdForNav}`);
                return;
            }

            const destination = await NavigationService.determinePlayerSpaceDestination(
                localeRef.current,
                dispatch,
                appStore.getState,
            );
            routerRef.current.push(destination.path);
        };

        socket.on("session:participant-character-changed", onParticipantCharacterChanged);
        socket.on("session:participant-joined", onParticipantJoined);
        socket.on("session:participant-left", onParticipantLeft);
        socket.on("session:participant-disconnected", onParticipantDisconnected);
        socket.on("session:expired", onSessionExpired);
        socket.on("session:closed", onSessionClosed);
        socket.on("session:token-updated", onTokenUpdated);
        socket.on("session:launched", onSessionLaunched);

        return () => {
            socket.off("session:participant-character-changed", onParticipantCharacterChanged);
            socket.off("session:participant-joined", onParticipantJoined);
            socket.off("session:participant-left", onParticipantLeft);
            socket.off("session:participant-disconnected", onParticipantDisconnected);
            socket.off("session:expired", onSessionExpired);
            socket.off("session:closed", onSessionClosed);
            socket.off("session:token-updated", onTokenUpdated);
            socket.off("session:launched", onSessionLaunched);
            releaseSessionSocket();
            socketRef.current = null;
        };
    }, [token, code, fetchCharacterDetails, dispatch, appStore, campaignId]);

    const handleCharacterChange = (characterId: string) => {
        const socket = socketRef.current;
        if (!socket?.connected || isChangingCharacter) return;
        setIsChangingCharacter(true);
        socket.emit("session:change-character", { sessionId: code, characterId });
        socket.once("session:participant-character-changed", () => {
            setIsChangingCharacter(false);
        });
        socket.once("session:error", () => {
            setIsChangingCharacter(false);
            toast.error(t("toast.characterChangeError"));
        });
    };

    const handleLeave = async () => {
        if (isLeaving) return;
        setIsLeaving(true);

        const socket = socketRef.current;
        const userId = currentUser?.keycloakId;
        const myParticipant = participantsRef.current.find((p) => p.userId === userId);
        const shouldStripGroups =
            Boolean(campaignId?.trim()) &&
            Boolean(myParticipant?.characterId) &&
            myParticipant?.status !== "gameMaster";

        const afterLeaveSuccess = async () => {
            if (shouldStripGroups && campaignId && myParticipant?.characterId) {
                try {
                    await removePlayerFromCampaignGroupsOnSessionLeave(campaignId, myParticipant.characterId);
                    dispatch(invalidateGroupCache());
                } catch (e) {
                    console.error("Failed to remove player from campaign groups after leaving session:", e);
                }
            }
            dispatch(clearCurrentSession());
            toast.info(t("toast.leaveSuccess"));
            router.push(`/${locale}/welcome`);
        };

        if (socket?.connected) {
            socket.emit("session:leave", { sessionId: code });
            socket.once("session:left", () => {
                void afterLeaveSuccess();
            });
            socket.once("session:error", () => {
                toast.error(t("toast.leaveError"));
                setIsLeaving(false);
            });
        } else {
            try {
                await sessionService.leaveSession(code);
                await afterLeaveSuccess();
            } catch {
                toast.error(t("toast.leaveError"));
                setIsLeaving(false);
            }
        }
    };

    const handleAddToken = () => {
        const socket = socketRef.current;
        const userId = currentUser?.keycloakId;
        if (!userId || !socket?.connected) return;
        const totalTokens = Object.values(tokensByUserRef.current).reduce((a, b) => a + b, 0);
        if (totalTokens >= participantsRef.current.length) return;
        const myDeposited = tokensByUserRef.current[userId] ?? 0;
        if (myDeposited >= (currentUser?.balance ?? 0)) return;
        socket.emit("session:add-token", { sessionId: code });
    };

    const handleRemoveToken = () => {
        const socket = socketRef.current;
        const userId = currentUser?.keycloakId;
        if (!userId || !socket?.connected) return;
        if ((tokensByUserRef.current[userId] ?? 0) <= 0) return;
        socket.emit("session:remove-token", { sessionId: code });
    };

    const handleAddTokenAmount = (amount: number) => {
        const socket = socketRef.current;
        const userId = currentUser?.keycloakId;
        if (!userId || !socket?.connected) return;
        const totalTokens = Object.values(tokensByUserRef.current).reduce((a, b) => a + b, 0);
        const myDeposited = tokensByUserRef.current[userId] ?? 0;
        const maxAdd = Math.min(
            participantsRef.current.length - totalTokens,
            (currentUser?.balance ?? 0) - myDeposited,
        );
        const actualAmount = Math.min(amount, maxAdd);
        if (actualAmount <= 0) return;
        socket.emit("session:add-tokens", { sessionId: code, amount: actualAmount });
    };

    const handleRemoveTokenAmount = (amount: number) => {
        const socket = socketRef.current;
        const userId = currentUser?.keycloakId;
        if (!userId || !socket?.connected) return;
        const myDeposited = tokensByUserRef.current[userId] ?? 0;
        const actualAmount = Math.min(amount, myDeposited);
        if (actualAmount <= 0) return;
        socket.emit("session:remove-tokens", { sessionId: code, amount: actualAmount });
    };

    const handleLaunchSession = () => {
        const socket = socketRef.current;
        if (!socket?.connected || isLaunching) return;
        setIsLaunching(true);



        socket.emit("session:launch", { sessionId: code });
        socket.once("session:launched", () => {
            setIsLaunching(false);
        });
        socket.once("session:error", (error) => {
            console.log("Session launch error:", error);
            toast.error(t("toast.sessionLaunchError"));
            setIsLaunching(false);
        });
    };

    const handleDismissSessionEnd = () => {
        dispatch(clearCurrentSession());
        router.push(`/${locale}/welcome`);
    };

    const handleCloseSession = () => {
        const socket = socketRef.current;
        if (!socket?.connected) return;
        socket.emit("session:close", { sessionId: code });
    };

    return { handleCharacterChange, handleLeave, handleAddToken, handleRemoveToken, handleAddTokenAmount, handleRemoveTokenAmount, handleLaunchSession, handleDismissSessionEnd, isChangingCharacter, isLeaving, isLaunching, sessionEndReason, handleCloseSession };
}
