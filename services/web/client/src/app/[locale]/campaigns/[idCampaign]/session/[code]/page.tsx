"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useKeycloak } from "@/providers/KeycloakProvider";
import campaignService from "@/services/CampaignService";
import characterService from "@/services/CharacterService";
import sessionService, { SessionParticipant } from "@/services/SessionService";
import UserService from "@/services/UserService";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import { setCurrentSession, clearCurrentSession } from "@/store/slices/sessionSlice";
import { selectUser } from "@/store/slices/userSlice";
import { Character } from "@/types/character";
import Token from "@public/assets/token.svg";
import { Check, Copy, Link, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";

export default function SessionPage() {
  const t = useTranslations("sessionPage");
  const { idCampaign, code } = useParams<{ idCampaign: string; code: string }>();
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const toast = useToast();
  const { token } = useKeycloak();
  const currentUser = useAppSelector(selectUser);

  const [campaignLabel, setCampaignLabel] = useState<string | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [characterDetails, setCharacterDetails] = useState<Record<string, Character>>({});
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);
  const [codeCopyState, setCodeCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [isChangingCharacter, setIsChangingCharacter] = useState(false);

  const socketRef = useRef<Socket | null>(null);

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
        await sessionService.getSession(code);
        dispatch(setCurrentSession({ code, campaignId: idCampaign }));
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

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_SESSION_WS_URL ?? "http://localhost:9002";

    const socket = io(`${wsUrl}/session`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      const myParticipant = participants.find((p) => p.userId === currentUser?.keycloakId);
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
        status: "connected" | "MasterGame" | "disconnected";
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
        // Set username as immediate fallback, then try to fetch the real display name
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
      setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, status: "disconnected" as const } : p)));
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
      toast.success(t("toast.characterChanged"));
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

  const copy = (text: string, setState: Dispatch<SetStateAction<"idle" | "loading" | "success">>): void => {
    setState("loading");
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setState("success");
          setTimeout(() => setState("idle"), 1000);
        })
        .catch(() => {
          setState("idle");
          toast.error(t("toast.copyError"));
        });
    } else {
      setState("idle");
      toast.error(t("toast.copyNotSupported"));
    }
  };

  const getCharacterLabel = (characterId: string | null): string => {
    if (!characterId) return "";
    const char = characterDetails[characterId];
    if (!char) return characterId;
    return `${char.firstname} ${char.lastname}`.trim() || char.surname || characterId;
  };

  return (
    <main
      className="flex flex-col min-h-dvh"
      aria-label={t("mainAriaLabel", { label: campaign?.label ?? campaignLabel ?? t("campaignFallback") })}>
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Players section */}
        <section
          aria-labelledby="players-heading"
          className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4 sm:p-6">
            <h1
              id="players-heading"
              className="text-xl sm:text-2xl font-bold">
              {t("title")}
              <span className="font-normal"> - {campaign?.label ?? campaignLabel}</span>
            </h1>

            <div
              role="list"
              aria-label={t("players.ariaLabel")}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-start gap-3 h-[50vh] overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
              tabIndex={0}>
              {participants.length > 0 &&
                participants.map((participant) => {
                  const isMe = participant.userId === currentUser?.keycloakId;
                  const isPlayer = participant.status === "connected";
                  const characterLabel = getCharacterLabel(participant.characterId);

                  return (
                    <Card
                      key={participant.id}
                      role="listitem"
                      className="border bg-gray border-none flex flex-col gap-2 p-3">
                      <div className="flex flex-row justify-between items-center gap-3">
                        <span className="font-medium">{participantNames[participant.userId] ?? "..."}</span>
                        {participant.status === "MasterGame" && <Badge>{t("players.masterGame")}</Badge>}
                        {participant.status === "connected" && (
                          <Badge variant={"secondary"}>{t("players.player")}</Badge>
                        )}
                      </div>

                      {isMe && isPlayer ? (
                        <Select
                          value={participant.characterId ?? ""}
                          onValueChange={handleCharacterChange}
                          disabled={isChangingCharacter}>
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder={t("players.selectCharacterPlaceholder")}>
                              {characterLabel || t("players.selectCharacterPlaceholder")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {myCharacters.map((char) => (
                              <SelectItem
                                key={char._id}
                                value={char._id}>
                                {`${char.firstname} ${char.lastname}`.trim() || char.surname || char._id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        participant.characterId && (
                          <span className="text-xs text-muted-foreground">{characterLabel}</span>
                        )
                      )}
                    </Card>
                  );
                })}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={isLeaving}>
                {t("players.leaveButton")}
              </Button>
              <Button aria-label={t("players.addTokenAriaLabel", { count: participants.length })}>
                <span className="flex items-center gap-1.5">
                  {t("players.addTokenButton", { count: participants.length })}
                  <Image
                    src={Token}
                    alt=""
                    aria-hidden="true"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                </span>
              </Button>
            </div>
          </Card>
        </section>

        {/* Session code section */}
        <aside
          aria-labelledby="session-code-heading"
          className="lg:col-span-1">
          <Card className="flex flex-col gap-0 p-4 sm:p-6">
            <h2
              id="session-code-heading"
              className="text-base sm:text-lg font-bold mb-4">
              {t("sessionCode.heading")}
            </h2>
            <p
              className="w-full text-xl text-center"
              aria-label={t("sessionCode.ariaLabel", { code })}>
              {code}
            </p>
            <div className="gap-3 items-center grid grid-cols-5">
              <Button
                variant="outline"
                className={`mt-4 w-full transition-colors col-span-4 ${
                  codeCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                }`}
                aria-label={t("sessionCode.copyAriaLabel")}
                disabled={codeCopyState !== "idle"}
                onClick={() => copy(code, setCodeCopyState)}>
                {codeCopyState === "loading" && <Loader2 className="animate-spin" />}
                {codeCopyState === "success" && <Check />}
                {codeCopyState === "idle" && <Copy />}
                {codeCopyState === "success" ? t("sessionCode.copySuccess") : t("sessionCode.copyButton")}
              </Button>
              <Button
                aria-label={t("sessionCode.copyLinkAriaLabel")}
                className={`mt-4 transition-colors ${
                  linkCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                }`}
                disabled={linkCopyState !== "idle"}
                onClick={() => copy(window.location.href, setLinkCopyState)}>
                {linkCopyState === "success" ? <Check /> : <Link />}
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
