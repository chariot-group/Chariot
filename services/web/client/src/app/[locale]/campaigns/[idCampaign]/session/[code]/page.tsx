"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CharacterSelect } from "@/components/character/CharacterSelect";
import { useToast } from "@/hooks/useToast";
import { useSessionData } from "@/hooks/useSessionData";
import type { SessionParticipant } from "@/services/SessionService";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppSelector } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import { selectUser } from "@/store/slices/userSlice";
import Token from "@public/assets/token.svg";
import { Check, ChevronDown, Copy, Link, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React, { useState, type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionEndedDialog } from "@/components/dialogs/SessionEndedDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectSessionStatus } from "@/store/slices/sessionSlice";
import { ConfirmCancelSessionDialog } from "@/components/dialogs/ConfirmCancelSessionDialog";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";

export default function SessionPage() {
  const t = useTranslations("sessionPage");
  const { idCampaign, code } = useParams<{ idCampaign: string; code: string }>();
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);
  const { token } = useKeycloak();
  const currentUser = useAppSelector(selectUser);
  const toast = useToast();

  const sessionStatus = useAppSelector(selectSessionStatus);
  const sessionIsActive = sessionStatus == "activated";
  const [codeCopyState, setCodeCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [linkCopyState, setLinkCopyState] = useState<"idle" | "loading" | "success">("idle");
  const [tokensByUser, setTokensByUser] = useState<Record<string, number>>({});
  const [customAmount, setCustomAmount] = useState(1);

  const {
    campaignLabel,
    participants,
    setParticipants,
    participantNames,
    myCharacters,
    fetchCharacterDetails,
    getCharacterLabel,
    isLoading,
  } = useSessionData({ code, idCampaign, campaign }) as ReturnType<typeof useSessionData>;

  const totalTokens = Object.values(tokensByUser).reduce((a, b) => a + b, 0);
  const myTokens = currentUser ? (tokensByUser[currentUser.keycloakId] ?? 0) : 0;
  const maxTokens = participants.length;
  const isMJ = participants.find((p) => p.userId === currentUser?.keycloakId)?.status === "gameMaster";
  const maxAddable = Math.min((currentUser?.balance ?? 0) - myTokens, maxTokens - totalTokens);
  const maxCustomAmount = Math.max(1, Math.max(maxAddable, myTokens));

  const sessionSocket = useSessionSocket({
    token,
    code,
    campaignId: idCampaign,
    campaignName: campaign?.label ?? campaignLabel ?? "",
    currentUser,
    participants,
    setParticipants,
    fetchCharacterDetails,
    tokensByUser,
    setTokensByUser,
  });

  // Affiche un loader tant que le socket n'est pas prêt
  if (isLoading || !sessionSocket) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span>Chargement de la session…</span>
      </div>
    );
  }

  const {
    handleCharacterChange,
    handleLeave,
    handleAddToken,
    handleAddTokenAmount,
    handleRemoveTokenAmount,
    handleLaunchSession,
    handleDismissSessionEnd,
    isChangingCharacter,
    isLeaving,
    isLaunching,
    sessionEndReason,
    handleCloseSession,
  } = sessionSocket;

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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span>Chargement de la session…</span>
      </div>
    );
  }

  return (
    <React.Fragment>
      <SessionEndedDialog
        reason={sessionEndReason}
        onConfirm={handleDismissSessionEnd}
      />
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
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 items-start gap-3 overflow-y-auto scroll-smooth focus-visible:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full"
                tabIndex={0}>
                {participants.length > 0 &&
                  participants.map((participant: SessionParticipant) => {
                    const isMe = participant.userId === currentUser?.keycloakId;
                    const isPlayer = participant.status === "connected";
                    const characterLabel = getCharacterLabel(participant.characterId);

                    return (
                      <Card
                        key={participant.id}
                        role="listitem"
                        className="bg-gray flex flex-col gap-2 p-3">
                        <div className="flex flex-row justify-between items-center gap-3">
                          <span className="font-medium">
                            {participantNames[participant.userId] ?? SESSION_PARTICIPANT_NAME_LOADING}
                          </span>
                          {participant.status === "gameMaster" && <Badge>{t("players.gameMaster")}</Badge>}
                          {participant.status === "connected" && (
                            <Badge variant={"secondary"}>{t("players.player")}</Badge>
                          )}
                        </div>

                        {isMe && isPlayer && sessionIsActive ? (
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
                          <span className="text-xs text-muted-foreground truncate">{characterLabel ?? "\u00A0"}</span>
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
                {isMJ && !sessionIsActive && (
                  <ConfirmCancelSessionDialog onConfirm={handleCloseSession}>
                    <Button
                      type="button"
                      variant="destructive">
                      Clôturer la session
                    </Button>
                  </ConfirmCancelSessionDialog>
                )}
                {/* Split token button */}
                {sessionIsActive && (
                  <div className="flex items-center">
                    <Button
                      className="rounded-r-none border-r-0 pr-1"
                      aria-label={
                        totalTokens >= maxTokens
                          ? t("players.launchSessionAriaLabel")
                          : t("players.addTokenAriaLabel", { count: maxTokens, total: totalTokens })
                      }
                      disabled={!sessionIsActive || (totalTokens >= maxTokens ? !isMJ || isLaunching : maxAddable <= 0)}
                      onClick={totalTokens >= maxTokens ? handleLaunchSession : handleAddToken}>
                      {totalTokens >= maxTokens ? (
                        <React.Fragment>
                          {isLaunching ? <Loader2 className="animate-spin" /> : null}
                          {t("players.launchSessionButton")}
                        </React.Fragment>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {t("players.addTokenButton", { count: maxTokens, total: totalTokens })}
                          <Image
                            src={Token}
                            alt=""
                            aria-hidden="true"
                            className="w-3 h-3 sm:w-4 sm:h-4"
                          />
                        </span>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={!sessionIsActive}
                        asChild>
                        <Button
                          disabled={!sessionIsActive}
                          className="rounded-l-none px-2 pl-1"
                          aria-label={t("players.tokenMenuAriaLabel")}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 p-3">
                        {/* Custom amount selector */}
                        <p className="text-xs text-muted-foreground mb-2">{t("players.customAmount")}</p>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            disabled={customAmount <= 1}
                            onClick={() => setCustomAmount((a) => Math.max(1, a - 1))}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{customAmount}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            disabled={customAmount >= maxCustomAmount}
                            onClick={() => setCustomAmount((a) => Math.min(maxCustomAmount, a + 1))}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mb-1">
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={maxAddable <= 0}
                            onClick={() => handleAddTokenAmount(customAmount)}>
                            <Plus className="w-3 h-3" />
                            {t("players.addCustomButton")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={myTokens <= 0}
                            onClick={() => handleRemoveTokenAmount(customAmount)}>
                            <Minus className="w-3 h-3" />
                            {t("players.removeCustomButton")}
                          </Button>
                        </div>
                        {myTokens > 0 && (
                          <React.Fragment>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleRemoveTokenAmount(myTokens)}>
                              <Trash2 className="w-3 h-3" />
                              {t("players.removeAllButton", { myTokens })}
                            </DropdownMenuItem>
                          </React.Fragment>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={t("sessionCode.copyLinkAriaLabel")}
                      className={`mt-4 transition-colors ${
                        linkCopyState === "success" ? "bg-green-500 hover:bg-green-500 border-green-500 text-white" : ""
                      }`}
                      disabled={linkCopyState !== "idle"}
                      onClick={() =>
                        copy(`${window.location.origin}/campaigns/${idCampaign}/session/${code}`, setLinkCopyState)
                      }>
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
    </React.Fragment>
  );
}
