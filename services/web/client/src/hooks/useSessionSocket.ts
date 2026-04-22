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
    currentUser: { keycloakId: string } | null | undefined;
    participants: SessionParticipant[];
    setParticipants: React.Dispatch<React.SetStateAction<SessionParticipant[]>>;
    setParticipantNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    fetchCharacterDetails: (ids: string[]) => Promise<void>;
}

export function useSessionSocket({
    token,
    code,
    currentUser,
    participants,
    setParticipants,
    setParticipantNames,
    fetchCharacterDetails,
}: UseSessionSocketOptions) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("sessionPage");
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "fr";

    const socketRef = useRef<Socket | null>(null);
    const participantsRef = useRef(participants);
    const [isChangingCharacter, setIsChangingCharacter] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Keep ref in sync so the connect handler always sees the latest participants
    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

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

    return { handleCharacterChange, handleLeave, isChangingCharacter, isLeaving };
}
