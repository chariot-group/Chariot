"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import sessionService, { type SessionParticipant } from "@/services/SessionService";
import UserService from "@/services/UserService";
import { useAppDispatch } from "@/store/hooks";
import { clearCurrentSession } from "@/store/slices/sessionSlice";
import { useToast } from "@/hooks/useToast";

interface UseSessionSocketOptions {
    token: string | null | undefined;
    code: string;
    campaignName: string;
    currentUser: { keycloakId: string; balance: number } | null | undefined;
    participants: SessionParticipant[];
    setParticipants: React.Dispatch<React.SetStateAction<SessionParticipant[]>>;
    setParticipantNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    fetchCharacterDetails: (ids: string[]) => Promise<void>;
    tokensByUser: Record<string, number>;
    setTokensByUser: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function useSessionSocket({
    token,
    code,
    campaignName,
    currentUser,
    participants,
    setParticipants,
    setParticipantNames,
    fetchCharacterDetails,
    tokensByUser,
    setTokensByUser,
}: UseSessionSocketOptions) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const socketRef = useRef<Socket | null>(null);
    const participantsRef = useRef(participants);
    const tokensByUserRef = useRef(tokensByUser);
    const campaignNameRef = useRef(campaignName);
    const [isChangingCharacter, setIsChangingCharacter] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);

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
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_SESSION_WS_URL ?? "http://localhost:9002";

        const socket = io(`${wsUrl}/session`, {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            const myParticipant = participantsRef.current.find((p) => p.userId === currentUser?.keycloakId);
            socket.emit("session:join", {
                sessionId: code,
                characterId: myParticipant?.characterId ?? null,
            });
        });

        socket.on(
            "session:participant-character-changed",
            ({ userId, characterId }: { userId: string; characterId: string }) => {
                setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, characterId } : p)));
                fetchCharacterDetails([characterId]);
            },
        );

        socket.on(
            "session:participant-joined",
            async ({
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
                setParticipants((prev) => {
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
                setParticipantNames((prev) => (prev[userId] ? prev : { ...prev, [userId]: username || userId }));
                try {
                    const user = await UserService.getUserById(userId);
                    setParticipantNames((prev) => ({
                        ...prev,
                        [userId]: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username,
                    }));
                } catch {
                    // keep the username fallback already set
                }
                if (characterId) fetchCharacterDetails([characterId]);
            },
        );

        socket.on("session:participant-left", ({ userId }: { userId: string }) => {
            setParticipants((prev) => prev.filter((p) => p.userId !== userId));
        });

        socket.on("session:participant-disconnected", ({ userId }: { userId: string }) => {
            setParticipants((prev) =>
                prev.map((p) => (p.userId === userId ? { ...p, status: "disconnected" as const } : p)),
            );
        });

        socket.on("session:expired", () => {
            dispatch(clearCurrentSession());
            router.push(`/${locale}/welcome`);
        });

        socket.on("session:closed", () => {
            dispatch(clearCurrentSession());
            router.push(`/${locale}/welcome`);
        });

        socket.on("session:token-updated", ({ tokensByUser: updatedTokens }: { tokensByUser: Record<string, number> }) => {
            setTokensByUser(updatedTokens);
        });

        socket.on("session:launched", async () => {
            toast.success(t("toast.sessionLaunched"));
            const userId = currentUser?.keycloakId;
            const myTokens = userId ? (tokensByUserRef.current[userId] ?? 0) : 0;
            if (userId && myTokens >= 1) {
                try {
                    await UserService.addHistory(campaignNameRef.current, myTokens);
                } catch {
                    // history update failure should not block navigation
                }
            }
            const myParticipant = participantsRef.current.find((p) => p.userId === userId);
            if (myParticipant?.characterId) {
                router.push(`/${locale}/characters/${myParticipant.characterId}`);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

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

        if (socket?.connected) {
            socket.emit("session:leave", { sessionId: code });
            socket.once("session:left", () => {
                dispatch(clearCurrentSession());
                toast.info(t("toast.leaveSuccess"));
                router.push(`/${locale}/welcome`);
            });
            socket.once("session:error", () => {
                toast.error(t("toast.leaveError"));
                setIsLeaving(false);
            });
        } else {
            try {
                await sessionService.leaveSession(code);
                dispatch(clearCurrentSession());
                toast.info(t("toast.leaveSuccess"));
                router.push(`/${locale}/welcome`);
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

    const handleLaunchSession = () => {
        const socket = socketRef.current;
        if (!socket?.connected || isLaunching) return;
        setIsLaunching(true);
        socket.emit("session:launch", { sessionId: code });
        socket.once("session:launched", () => {
            setIsLaunching(false);
        });
        socket.once("session:error", () => {
            toast.error(t("toast.sessionLaunchError"));
            setIsLaunching(false);
        });
    };

    return { handleCharacterChange, handleLeave, handleAddToken, handleRemoveToken, handleLaunchSession, isChangingCharacter, isLeaving, isLaunching };
}
