"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CharacterSelect } from "@/components/character/CharacterSelect";
import { useToast } from "@/hooks/useToast";
import { useSessionData } from "@/hooks/useSessionData";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppSelector } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import { selectUser } from "@/store/slices/userSlice";
import Token from "@public/assets/token.svg";
import { Check, Copy, Link, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function SessionPage() {
  const t = useTranslations("sessionPage");
  const { idCampaign, code } = useParams<{ idCampaign: string; code: string }>();
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);
  const { token } = useKeycloak();
  const currentUser = useAppSelector(selectUser);
  const toast = useToast();

  const [codeCopyState, setCodeCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "loading" | "success">("idle");

  const {
    campaignLabel,
    participants,
    setParticipants,
    participantNames,
    setParticipantNames,
    myCharacters,
    fetchCharacterDetails,
    getCharacterLabel,
  } = useSessionData({ code, idCampaign, campaign });

  const { handleCharacterChange, handleLeave, isChangingCharacter, isLeaving } = useSessionSocket({
    token,
    code,
    currentUser,
    participants,
    setParticipants,
    setParticipantNames,
    fetchCharacterDetails,
  });

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

  return (
    <main
      className="flex-1 flex flex-col overflow-y-auto"
      aria-label={t("mainAriaLabel", { label: campaign?.label ?? campaignLabel ?? t("campaignFallback") })}>
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* Players section */}
        <section
          aria-labelledby="players-heading"
          className="xl:col-span-3 flex flex-col gap-4">
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
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 items-start gap-3 max-h-[40vh] xl:h-[55vh] overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
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
                        {participant.status === "gameMaster" && <Badge>{t("players.gameMaster")}</Badge>}
                        {participant.status === "connected" && (
                          <Badge variant={"secondary"}>{t("players.player")}</Badge>
                        )}
                      </div>

                      {isMe && isPlayer ? (
                        <CharacterSelect
                          characters={myCharacters}
                          value={participant.characterId ?? ""}
                          onValueChange={handleCharacterChange}
                          placeholder={t("players.selectCharacterPlaceholder")}
                          disabled={isChangingCharacter}
                          selectedLabel={characterLabel || undefined}
                          triggerClassName="w-full text-xs"
                        />
                      ) : (
                        participant.characterId && (
                          <span className="text-xs text-muted-foreground truncate">{characterLabel}</span>
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
          className="order-first xl:order-last xl:col-span-1">
          <Card className="flex flex-col gap-0 p-4 sm:p-6">
            <h2
              id="session-code-heading"
              className="text-base sm:text-lg font-bold mb-4">
              {t("sessionCode.heading")}
            </h2>
            <p
              className="w-full text-xl text-center"
              aria-label={t("sessionCode.ariaLabel", { code })}>
              {code.split("").slice(0, 3).join("")} - {code.split("").slice(3).join("")}
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
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    aria-label={t("sessionCode.copyLinkAriaLabel")}
                    className={`mt-4 transition-colors ${
                      linkCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                    }`}
                    disabled={linkCopyState !== "idle"}
                    onClick={() => copy(window.location.href, setLinkCopyState)}>
                    {linkCopyState === "success" ? <Check /> : <Link />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {linkCopyState === "success" ? t("sessionCode.copySuccess") : t("sessionCode.copyLink")}
                </TooltipContent>
              </Tooltip>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
