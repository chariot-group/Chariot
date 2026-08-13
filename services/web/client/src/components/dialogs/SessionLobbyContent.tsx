"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CharacterSelect } from "@/components/character/CharacterSelect";
import { useToast } from "@/hooks/useToast";
import { useSessionData } from "@/hooks/useSessionData";
import type { SessionParticipant } from "@/services/SessionService";
import type { Character } from "@/types/character";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { useUser } from "@/hooks/useUser";
import { useKeycloak } from "@/providers/KeycloakProvider";
import { useAppSelector } from "@/store/hooks";
import { selectCampaigns } from "@/store/slices/campaignSlice";
import { selectUser } from "@/store/slices/userSlice";
import Token from "@public/assets/token.svg";
import { QRCodeSVG } from "qrcode.react";
import { Check, ChevronDown, Copy, Link, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionEndedDialog } from "@/components/dialogs/SessionEndedDialog";
import { SessionWheelDepositBar } from "@/components/dialogs/SessionWheelDepositBar";
import { selectSessionStatus, selectSessionTokensByUser } from "@/store/slices/sessionSlice";
import { ConfirmCancelSessionDialog } from "@/components/dialogs/ConfirmCancelSessionDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SESSION_PARTICIPANT_NAME_LOADING } from "@/lib/formatSessionParticipantUserLabel";
import {
  buildSessionLobbyAvatarBatchItems,
  getSessionLobbyParticipantAvatarUrl,
  resolveSessionLobbyParticipantAvatar,
  type SessionLobbyParticipantAvatarDescriptor,
} from "@/lib/sessionLobbyAvatarBatch";
import { shouldShowSessionLobbyInvitePanel } from "@/lib/sessionInAppNavigation";
import {
  computeMaxAddableWheels,
  isWheelQuotaMetForLaunch,
  sumDepositedWheels,
} from "@/lib/sessionWheelDeposit";
import { cn } from "@/lib/utils";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import { useMediaAvatarBatch } from "@/hooks/useMediaAvatar";
import SessionTimer from "@/components/layout/SessionTimer";

type SessionLobbyCopyState = "idle" | "loading" | "success";

const SESSION_LOBBY_CARD_CLASS = "gap-3 rounded-[15px] p-3 shadow-sm sm:p-4";

function getSessionLobbyParticipantListClassName(participantCount: number): string {
  const base =
    "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto scroll-smooth focus-visible:outline-none sm:gap-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar]:w-2";

  if (participantCount < 5) {
    return base;
  }

  return cn(
    base,
    "lg:grid lg:grid-cols-2 lg:content-start lg:gap-3",
    participantCount % 2 === 1 && "lg:[&>*:last-child]:col-span-2",
  );
}

interface SessionLobbyContentProps {
  code: string;
  idCampaign: string;
}

export function SessionLobbyContent({ code, idCampaign }: SessionLobbyContentProps) {
  const t = useTranslations("sessionPage");
  const campaigns = useAppSelector(selectCampaigns);
  const campaign = campaigns.find((c) => c._id === idCampaign);
  const { token } = useKeycloak();
  useUser({ autoFetch: true });
  const currentUser = useAppSelector(selectUser);
  const toast = useToast();

  const sessionStatus = useAppSelector(selectSessionStatus);
  /** Lobby pré-lancement : invite code/QR + dépôt wheels + changement de perso. */
  const sessionIsActive = shouldShowSessionLobbyInvitePanel(sessionStatus);
  const [codeCopyState, setCodeCopyState] = useState<SessionLobbyCopyState>("idle");
  const [linkCopyState, setLinkCopyState] = useState<SessionLobbyCopyState>("idle");
  const reduxTokensByUser = useAppSelector(selectSessionTokensByUser);

  const {
    campaignLabel,
    participants,
    setParticipants,
    participantNames,
    participantAvatars,
    characterDetails,
    myCharacters,
    fetchCharacterDetails,
    getCharacterLabel,
    isLoading,
  } = useSessionData({ code, idCampaign, campaign }) as ReturnType<typeof useSessionData>;

  const avatarBatchItems = useMemo(
    () =>
      buildSessionLobbyAvatarBatchItems({
        participants,
        participantAvatars,
        characterDetails,
      }),
    [participants, participantAvatars, characterDetails],
  );

  const { getUrl: getAvatarUrl } = useMediaAvatarBatch(
    avatarBatchItems,
    code,
    !isLoading && participants.length > 0,
  );

  const totalDeposited = sumDepositedWheels(reduxTokensByUser);
  const myDeposited = currentUser ? (reduxTokensByUser[currentUser.keycloakId] ?? 0) : 0;
  const maxSlots = participants.length;
  const isMJ = participants.find((p) => p.userId === currentUser?.keycloakId)?.status === "gameMaster";
  const maxAddable = computeMaxAddableWheels({
    balance: currentUser?.balance ?? 0,
    myDeposited,
    totalDeposited,
    maxSlots,
  });
  const quotaFull = isWheelQuotaMetForLaunch(totalDeposited, maxSlots);

  const sessionSocket = useSessionSocket({
    token,
    code,
    campaignId: idCampaign,
    campaignName: campaign?.label ?? campaignLabel ?? "",
    currentUser,
    participants,
    setParticipants,
    fetchCharacterDetails,
  });

  if (isLoading || !sessionSocket) {
    return (
      <div className="flex flex-1 items-center justify-center h-full py-8">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        <span>Chargement de la session…</span>
      </div>
    );
  }

  const {
    handleCharacterChange,
    handleLeave,
    handleAddToken,
    handleRemoveToken,
    handleRemoveTokenAmount,
    handleDepositRemaining,
    handleLaunchSession,
    handleDismissSessionEnd,
    isChangingCharacter,
    isLeaving,
    isLaunching,
    sessionEndReason,
    handleCloseSession,
  } = sessionSocket;

  const copy = (text: string, setState: Dispatch<SetStateAction<SessionLobbyCopyState>>): void => {
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

  const joinUrl =
    typeof window !== "undefined"
      ? (() => {
          const url = new URL(window.location.href);
          url.searchParams.set("join", code);
          return url.toString();
        })()
      : `?join=${code}`;

  return (
    <React.Fragment>
      <SessionEndedDialog
        reason={sessionEndReason}
        onConfirm={handleDismissSessionEnd}
      />
      <div
        className="flex h-full min-h-0 flex-col"
        aria-label={t("mainAriaLabel", { label: campaign?.label ?? campaignLabel ?? t("campaignFallback") })}>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-4 sm:gap-4 sm:px-6 sm:pt-6",
            sessionIsActive && "lg:grid lg:grid-cols-4 lg:items-stretch",
          )}>
          {/* Session code + QR — only while join is open (activated lobby). @see FR-session-join-qr-code */}
          {sessionIsActive ? (
            <aside
              aria-labelledby="session-lobby-code-heading"
              className="flex shrink-0 flex-col gap-2 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:gap-3">
              <Card className={cn("max-w-full min-w-0 lg:hidden", SESSION_LOBBY_CARD_CLASS)}>
                <SessionLobbyCodeSection
                  code={code}
                  joinUrl={joinUrl}
                  inviteDisplay="responsive"
                  codeCopyState={codeCopyState}
                  linkCopyState={linkCopyState}
                  onCopyCode={() => copy(code, setCodeCopyState)}
                  onCopyLink={() => copy(joinUrl, setLinkCopyState)}
                  headingId="session-lobby-code-heading"
                />
              </Card>
              <Card className={cn("hidden w-full lg:flex", SESSION_LOBBY_CARD_CLASS)}>
                <SessionLobbyCodeSection
                  code={code}
                  inviteDisplay="text"
                  codeCopyState={codeCopyState}
                  linkCopyState={linkCopyState}
                  onCopyCode={() => copy(code, setCodeCopyState)}
                  onCopyLink={() => copy(joinUrl, setLinkCopyState)}
                  headingId="session-lobby-code-heading"
                />
              </Card>
              <Card className={cn("hidden w-full items-center lg:flex", SESSION_LOBBY_CARD_CLASS)}>
                <SessionLobbyQrSection
                  joinUrl={joinUrl}
                  showHeading
                />
              </Card>
            </aside>
          ) : null}

          {/* Participants + wheels */}
          <section
            aria-labelledby="session-lobby-players-heading"
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-2.5 lg:row-start-1 lg:gap-3",
              sessionIsActive ? "lg:col-span-3 lg:col-start-1" : "lg:col-span-full",
            )}>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pr-8">
              <h2
                id="session-lobby-players-heading"
                className="min-w-0 break-words text-xl font-bold sm:text-xl lg:text-lg">
                {t("title")}
                <span className="font-normal text-muted-foreground"> — {campaign?.label ?? campaignLabel}</span>
                <span className="sr-only"> ({participants.length})</span>
              </h2>
              <SessionTimer />
            </div>

            <div
              role="list"
              aria-label={t("players.ariaLabel")}
              className={getSessionLobbyParticipantListClassName(participants.length)}
              tabIndex={0}>
              {participants.length > 0 &&
                participants.map((participant: SessionParticipant) => {
                  const avatarDescriptor = resolveSessionLobbyParticipantAvatar(
                    participant,
                    participantAvatars,
                    characterDetails,
                  );

                  return (
                  <SessionLobbyParticipantCard
                    key={participant.id}
                    participant={participant}
                    participantName={
                      participantNames[participant.userId] ?? SESSION_PARTICIPANT_NAME_LOADING
                    }
                    characterLabel={getCharacterLabel(participant.characterId)}
                    participantDeposits={reduxTokensByUser[participant.userId] ?? 0}
                    isMe={participant.userId === currentUser?.keycloakId}
                    isPlayer={participant.status === "connected"}
                    sessionIsActive={sessionIsActive}
                    myCharacters={myCharacters}
                    isChangingCharacter={isChangingCharacter}
                    onCharacterChange={handleCharacterChange}
                    sessionCode={code}
                    avatarDescriptor={avatarDescriptor}
                    avatarImageUrl={getSessionLobbyParticipantAvatarUrl(avatarDescriptor, getAvatarUrl)}
                  />
                  );
                })}
            </div>
          </section>
        </div>

        {sessionIsActive ? (
          <div className="shrink-0 px-4 pb-4 sm:px-6 sm:pb-6">
            <SessionWheelDepositBar
              totalDeposited={totalDeposited}
              maxSlots={maxSlots}
              myDeposited={myDeposited}
              balance={currentUser?.balance ?? 0}
              maxAddable={maxAddable}
              isMJ={Boolean(isMJ)}
              isLaunching={isLaunching}
              isLeaving={isLeaving}
              quotaFull={quotaFull}
              leaveLabel={t("players.leaveButton")}
              onAddOne={handleAddToken}
              onRemoveOne={handleRemoveToken}
              onRemoveAll={() => handleRemoveTokenAmount(myDeposited)}
              onDepositRemaining={handleDepositRemaining}
              onLaunch={handleLaunchSession}
              onLeave={handleLeave}
            />
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}>
              {t("players.leaveButton")}
            </Button>
            {isMJ && (
              <ConfirmCancelSessionDialog onConfirm={handleCloseSession}>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm">
                  Clôturer la session
                </Button>
              </ConfirmCancelSessionDialog>
            )}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

interface SessionLobbyCopyActionsProps {
  codeCopyState: SessionLobbyCopyState;
  linkCopyState: SessionLobbyCopyState;
  onCopyCode: () => void;
  onCopyLink: () => void;
  align?: "center" | "start";
  fullWidth?: boolean;
}

function SessionLobbyCopyActions({
  codeCopyState,
  linkCopyState,
  onCopyCode,
  onCopyLink,
  align = "start",
  fullWidth = false,
}: SessionLobbyCopyActionsProps) {
  const t = useTranslations("sessionPage");
  const copyLabel = codeCopyState === "success" ? t("sessionCode.copySuccess") : t("sessionCode.copyButton");

  if (fullWidth) {
    return (
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full min-w-0 px-3 transition-colors sm:h-9",
            codeCopyState === "success" && "border-green-500 bg-green-500 text-white hover:bg-green-500",
          )}
          aria-label={t("sessionCode.copyAriaLabel")}
          disabled={codeCopyState !== "idle"}
          onClick={onCopyCode}>
          {codeCopyState === "loading" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
          {codeCopyState === "success" && <Check className="h-3.5 w-3.5 shrink-0" />}
          {codeCopyState === "idle" && <Copy className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{copyLabel}</span>
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("sessionCode.copyLinkAriaLabel")}
              className={cn(
                "h-8 w-8 shrink-0 transition-colors sm:h-9 sm:w-9",
                linkCopyState === "success" && "border-green-500 bg-green-500 text-white hover:bg-green-500",
              )}
              disabled={linkCopyState !== "idle"}
              onClick={onCopyLink}>
              {linkCopyState === "success" ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {linkCopyState === "success" ? t("sessionCode.copySuccess") : t("sessionCode.copyLink")}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2",
        align === "center" ? "justify-center" : "justify-start",
      )}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 w-auto shrink-0 px-3 transition-colors",
          codeCopyState === "success" && "border-green-500 bg-green-500 text-white hover:bg-green-500",
        )}
        aria-label={t("sessionCode.copyAriaLabel")}
        disabled={codeCopyState !== "idle"}
        onClick={onCopyCode}>
        {codeCopyState === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {codeCopyState === "success" && <Check className="h-3.5 w-3.5" />}
        {codeCopyState === "idle" && <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copyLabel}</span>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t("sessionCode.copyLinkAriaLabel")}
            className={cn(
              "shrink-0 transition-colors",
              linkCopyState === "success" && "border-green-500 bg-green-500 text-white hover:bg-green-500",
            )}
            disabled={linkCopyState !== "idle"}
            onClick={onCopyLink}>
            {linkCopyState === "success" ? <Check className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {linkCopyState === "success" ? t("sessionCode.copySuccess") : t("sessionCode.copyLink")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface SessionLobbyCodeSectionProps {
  code: string;
  codeCopyState: SessionLobbyCopyState;
  linkCopyState: SessionLobbyCopyState;
  onCopyCode: () => void;
  onCopyLink: () => void;
  headingId?: string;
  className?: string;
  joinUrl?: string;
  inviteDisplay?: "text" | "responsive";
}

function SessionLobbyCodeSection({
  code,
  codeCopyState,
  linkCopyState,
  onCopyCode,
  onCopyLink,
  headingId,
  className,
  joinUrl,
  inviteDisplay = "text",
}: SessionLobbyCodeSectionProps) {
  const t = useTranslations("sessionPage");
  const formattedCode = `${code.slice(0, 3)} - ${code.slice(3)}`;
  const isResponsiveInvite = inviteDisplay === "responsive" && Boolean(joinUrl);
  const [inviteDetailsOpen, setInviteDetailsOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h2
        id={headingId}
        className="text-sm font-bold sm:text-base">
        {t("sessionCode.heading")}
      </h2>

      {isResponsiveInvite && joinUrl ? (
        <Collapsible
          open={inviteDetailsOpen}
          onOpenChange={setInviteDetailsOpen}>
          <div className="flex w-full flex-col gap-2 rounded-[13px] bg-gray p-3">
            <div className="flex items-center justify-between gap-2">
              <p
                className="min-w-0 font-mono text-xl tracking-widest sm:text-2xl"
                aria-label={t("sessionCode.ariaLabel", { code })}>
                {formattedCode}
              </p>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  aria-expanded={inviteDetailsOpen}
                  aria-controls="session-lobby-invite-details"
                  aria-label={
                    inviteDetailsOpen
                      ? t("sessionCode.inviteToggleCollapse")
                      : t("sessionCode.inviteToggleExpand")
                  }>
                  <span className="hidden text-xs sm:inline">
                    {inviteDetailsOpen
                      ? t("sessionCode.inviteToggleCollapse")
                      : t("sessionCode.inviteToggleExpand")}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("h-4 w-4 shrink-0 transition-transform", inviteDetailsOpen && "rotate-180")}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent
              id="session-lobby-invite-details"
              className="flex flex-col gap-3 pt-1">
              <SessionLobbyQrSection
                joinUrl={joinUrl}
                size="compact"
                className="items-center"
              />
              <SessionLobbyCopyActions
                codeCopyState={codeCopyState}
                linkCopyState={linkCopyState}
                onCopyCode={onCopyCode}
                onCopyLink={onCopyLink}
                fullWidth
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      ) : (
        <>
          <p
            className="w-full text-center font-mono text-xl tracking-widest sm:text-2xl"
            aria-label={t("sessionCode.ariaLabel", { code })}>
            {formattedCode}
          </p>
          <SessionLobbyCopyActions
            codeCopyState={codeCopyState}
            linkCopyState={linkCopyState}
            onCopyCode={onCopyCode}
            onCopyLink={onCopyLink}
          />
        </>
      )}
    </div>
  );
}

interface SessionLobbyQrSectionProps {
  joinUrl: string;
  showHeading?: boolean;
  size?: "compact" | "invite" | "desktop";
  className?: string;
}

function SessionLobbyQrSection({
  joinUrl,
  showHeading = false,
  size = "desktop",
  className,
}: SessionLobbyQrSectionProps) {
  const t = useTranslations("sessionPage");

  const pixelSize = size === "invite" ? 144 : size === "compact" ? 80 : 120;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-2",
        size === "invite" ? "items-center sm:items-end" : "items-center",
        className,
      )}
      aria-label={t("sessionCode.qrCodeAriaLabel")}>
      {showHeading && (
        <h2 className="self-start text-sm font-bold sm:text-base">{t("sessionCode.qrCodeHeading")}</h2>
      )}
      <div className="shrink-0 rounded border border-border bg-white p-1.5 sm:p-2">
        <QRCodeSVG
          value={joinUrl}
          size={pixelSize}
          bgColor="#ffffff"
          fgColor="#19191c"
          className={cn(
            "block",
            size === "invite" && "h-32 w-32 sm:h-36 sm:w-36",
            size === "compact" && "h-20 w-20",
            size === "desktop" && "h-[72px] w-[72px] sm:h-20 sm:w-20 lg:h-[120px] lg:w-[120px]",
          )}
        />
      </div>
    </div>
  );
}

interface SessionLobbyParticipantCardProps {
  participant: SessionParticipant;
  participantName: string;
  characterLabel: string | null;
  participantDeposits: number;
  isMe: boolean;
  isPlayer: boolean;
  sessionIsActive: boolean;
  myCharacters: Character[];
  isChangingCharacter: boolean;
  onCharacterChange: (characterId: string) => void;
  sessionCode: string;
  avatarDescriptor: SessionLobbyParticipantAvatarDescriptor | null;
  avatarImageUrl?: string | null;
}

function SessionLobbyParticipantCard({
  participant,
  participantName,
  characterLabel,
  participantDeposits,
  isMe,
  isPlayer,
  sessionIsActive,
  myCharacters,
  isChangingCharacter,
  onCharacterChange,
  sessionCode,
  avatarDescriptor,
  avatarImageUrl,
}: SessionLobbyParticipantCardProps) {
  const t = useTranslations("sessionPage");
  const isGameMaster = participant.status === "gameMaster";
  const avatarAlt = isGameMaster
    ? participantName
    : characterLabel?.trim() || participantName;

  return (
    <Card
      role="listitem"
      className="w-full gap-0 rounded-[15px] border border-border/30 bg-gray-middle-light p-0 shadow-none">
      <div className="flex w-full flex-col gap-3 p-4 sm:p-3">
        <div className="flex w-full gap-3">
          <MediaAvatar
            scope={avatarDescriptor?.scope ?? "character"}
            entityId={avatarDescriptor?.entityId ?? ""}
            storedValue={avatarDescriptor?.storedValue}
            size="thumb"
            sessionCode={sessionCode}
            alt={avatarAlt}
            enabled={Boolean(avatarDescriptor?.storedValue?.trim())}
            avatarImageUrl={avatarImageUrl}
            className="self-center"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-base font-semibold text-white">{participantName}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                {participantDeposits > 0 ? (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-xs font-medium tabular-nums"
                    aria-label={t("players.wheels.participantDepositsAria", { count: participantDeposits })}>
                    {participantDeposits}
                    <Image
                      src={Token}
                      alt=""
                      aria-hidden="true"
                      className="h-3 w-3"
                    />
                  </span>
                ) : null}
                {participant.status === "gameMaster" ? (
                  <Badge className="shrink-0">{t("players.gameMaster")}</Badge>
                ) : null}
                {participant.status === "connected" ? (
                  <Badge
                    variant="secondary"
                    className="shrink-0">
                    {t("players.player")}
                  </Badge>
                ) : null}
              </div>
            </div>
            {!(isMe && isPlayer && sessionIsActive) ? (
              <p className="truncate text-sm text-muted-foreground">{characterLabel ?? " "}</p>
            ) : null}
          </div>
        </div>

        {isMe && isPlayer && sessionIsActive ? (
          <CharacterSelect
            characters={myCharacters}
            value={participant.characterId ?? ""}
            onValueChange={onCharacterChange}
            placeholder={t("players.selectCharacterPlaceholder")}
            disabled={isChangingCharacter}
            selectedLabel={characterLabel || undefined}
            triggerClassName="h-10 w-full text-sm"
          />
        ) : null}
      </div>
    </Card>
  );
}
