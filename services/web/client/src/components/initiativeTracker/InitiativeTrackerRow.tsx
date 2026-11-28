"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { ChevronDown, ChevronRight, HeartCrack, Layers2, Pencil, Skull, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow as InitiativeTrackerRowType,
} from "@/store/slices/sessionSlice";
import { ConditionSelect, type ConditionSelectCustomEffectsProps } from "@/components/initiativeTracker/ConditionSelect";
import { HiddenFieldPlaceholder } from "@/components/initiativeTracker/HiddenFieldPlaceholder";
import {
  InitiativeTrackerVisibilityDialog,
  VisibilityTriggerButton,
} from "@/components/initiativeTracker/InitiativeTrackerVisibilityDialog";
import {
  SESSION_PARTICIPANTS_GROUP_ID,
  TRACKER_CARD_PADDING_X_CLASS,
  TRACKER_CELL_ALIGN,
  TRACKER_GRID_GAP_CLASS,
  TRACKER_GRID_TEMPLATE_COLUMNS,
} from "@/components/initiativeTracker/constants";
import type { RowStatusAnimation } from "@/hooks/useStatusChangedRows";
import { CONDITION_META, CUSTOM_EFFECT_META } from "@/components/initiativeTracker/conditionMeta";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import {
  characterName,
  getInitiativeTrackerRowStatus,
  resolvePlayerDisplayNameForSave,
  resolvePlayerTrackerDisplayName,
  shouldShowGmPlayerAliasSubtitle,
  truncateTrackerLabel,
  type InitiativeTrackerRowStatus,
} from "@/components/initiativeTracker/utils";
import { InitiativeNumberInput } from "@/components/initiativeTracker/InitiativeNumberInput";
import { InitiativeModifierHint } from "@/components/initiativeTracker/InitiativeModifierHint";
import { MediaAvatar } from "@/components/media/MediaAvatar";
import {
  ConcentrationSpellDialog,
  type ConcentrationDialogIntent,
} from "@/components/initiativeTracker/ConcentrationSpellDialog";
import { ConcentrationStateBadge } from "@/components/initiativeTracker/ConcentrationStateBadge";
import {
  shouldShowConcentrationSaveDialog,
} from "@/components/initiativeTracker/concentration.utils";
import type { TrackerConcentration } from "@/store/slices/sessionSlice";
import { TrackerGridCell } from "@/components/initiativeTracker/TrackerGridCell";
import { ConditionBadgeHelp } from "@/components/initiativeTracker/ConditionBadgeHelp";
import { formatSignedBonus } from "@/utils/attack.utils";
import { FACT_CELL_CLASS } from "@/components/character/tabContents/shared/factCell";

type InitiativeTrackerRowProps = {
  row: InitiativeTrackerRowType;
  mode?: "gm" | "player";
  ownCharacterId?: string | null;
  ownCharacterSheetHref?: string | null;
  /** Pre-resolved presigned URL (batch) for tracker thumbnail. */
  avatarImageUrl?: string | null;
  sessionCode?: string | null;
  isActiveTurn?: boolean;
  isNewlyRevealed?: boolean;
  statusChangeAnimation?: RowStatusAnimation | null;
  initiativeLocked?: boolean;
  selectionEnabled?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  selectRowLabel?: string;
  /** FR-combat-initiative-tracker — pre-combat guidance: initiative not entered yet. */
  initiativeMissing?: boolean;
  initiativeMissingLabel?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  gridTemplateColumns?: string;
  getSheetHref?: (characterId: string) => string;
  onUpdateRow?: (id: string, changes: Partial<Omit<InitiativeTrackerRowType, "id">>) => void;
  onAddCondition?: (
    row: InitiativeTrackerRowType,
    condition: ActiveInitiativeTrackerCondition,
    duration?: InitiativeTrackerConditionDuration,
  ) => void;
  onRemoveCondition?: (row: InitiativeTrackerRowType, condition: ActiveInitiativeTrackerCondition) => void;
  onClearConditions?: (row: InitiativeTrackerRowType) => void;
  customEffects?: ConditionSelectCustomEffectsProps;
  onHitPointsClick?: (row: InitiativeTrackerRowType) => void;
  onRemoveFromInitiative?: (rowId: string) => void;
  battleStarted?: boolean;
  currentRound?: number;
  onSetConcentration?: (row: InitiativeTrackerRowType, concentration: TrackerConcentration | null) => void;
  onOpenConcentrationSaveDialog?: (row: InitiativeTrackerRowType) => void;
  labels: {
    initiativeFor: string;
    initiativeModifierFor: (bonus: string) => string;
    initiativeRollPlaceholder?: string;
    initiativeTotalPreview?: string;
    viewSheetFor: string;
    viewSheet: string;
    viewOwnSheet: string;
    onlyOwnCharacterSheet: string;
    conditionFor: string;
    conditionSearchPlaceholder: string;
    conditionSearchClear: string;
    conditionClearAll: string;
    conditionSearchEmpty: string;
    conditionAddBack: string;
    conditionAddConfirm: string;
    conditionDurationEnable: string;
    conditionDurationAmount: string;
    conditionRoundHint: string;
    visibleFor: string;
    playerDisplayNameSubtitle: string;
    ownCharacterBadge: string;
    ownCharacterLabel: string;
    hitPointsFor: string;
    hitPointsSessionTooltip: string;
    hpAbbr: string;
    /** Short visible labels of the mobile stat cells (full names stay accessible). */
    shortStatLabels?: { initiative: string; hitPoints: string; armorClass: string };
    hiddenField: string;
    otherGroup: string;
    expandDetails: string;
    collapseDetails: string;
    detailsFor: string;
    activeTurn: string;
    visibilityDialog: {
      title: string;
      showToPlayers: string;
      playerDisplayName: string;
      playerDisplayNameHint: string;
      playerDisplayNamePlaceholder: string;
      fields: {
        initiative: string;
        name: string;
        hitPoints: string;
        lifeStatus: string;
        armorClass: string;
        conditions: string;
        concentration: string;
        groupLabel: string;
      };
      apply: string;
      cancel: string;
      configureFor: string;
      leaveInitiative: string;
      playerRowVisibilityHint: string;
    };
    getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
    getConditionDescription: (condition: ActiveInitiativeTrackerCondition) => string;
    formatConditionEntryDuration: (
      entry: Pick<InitiativeTrackerConditionEntry, "duration" | "remainingSeconds">,
    ) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
    getStatusLabel: (status: InitiativeTrackerRowStatus) => string;
  };
};

/**
 * FR-combat-initiative-tracker — name / group label cut after 20 characters (`…`).
 * The full value stays available as tooltip and to assistive tech.
 */
function TrackerLabel({ value, className }: { value: string; className?: string }) {
  const short = truncateTrackerLabel(value);
  const isCut = short !== value.trim();
  return (
    <span
      className={className}
      title={value}>
      {isCut ? (
        <>
          <span aria-hidden="true">{short}</span>
          <span className="sr-only">{value}</span>
        </>
      ) : (
        value
      )}
    </span>
  );
}

export function InitiativeTrackerRow({
  row,
  mode = "gm",
  ownCharacterId = null,
  ownCharacterSheetHref = null,
  avatarImageUrl = null,
  sessionCode = null,
  isActiveTurn = false,
  isNewlyRevealed = false,
  statusChangeAnimation = null,
  initiativeLocked = false,
  selectionEnabled = false,
  isSelected = false,
  onSelectionChange,
  selectRowLabel,
  initiativeMissing = false,
  initiativeMissingLabel,
  isExpanded = false,
  onToggleExpanded,
  gridTemplateColumns = TRACKER_GRID_TEMPLATE_COLUMNS,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  customEffects,
  onHitPointsClick,
  onRemoveFromInitiative,
  battleStarted = false,
  currentRound = 1,
  onSetConcentration,
  onOpenConcentrationSaveDialog,
  labels,
}: InitiativeTrackerRowProps) {
  const tConc = useTranslations("initTracker.tracker.concentration");
  const isPlayerView = mode === "player";
  const fieldVis = row.playerFieldVisibility;
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);
  const [concentrationDialogOpen, setConcentrationDialogOpen] = React.useState(false);
  const [concentrationDialogIntent, setConcentrationDialogIntent] =
    React.useState<ConcentrationDialogIntent>("set");

  const openConcentrationDialog = React.useCallback(
    (intent?: ConcentrationDialogIntent) => {
      setConcentrationDialogIntent(
        intent ?? (row.concentration ? "replace" : "set"),
      );
      setConcentrationDialogOpen(true);
    },
    [row.concentration],
  );

  const gmName = characterName(row.firstname, row.lastname, row.surname);
  const isOwnCharacter = Boolean(
    isPlayerView && ownCharacterId && row.characterId === ownCharacterId,
  );
  const playerResolvedName = isPlayerView
    ? isOwnCharacter
      ? gmName
      : resolvePlayerTrackerDisplayName(row)
    : gmName;
  const displayName = playerResolvedName ?? gmName;
  const showHiddenName = isPlayerView && !isOwnCharacter && playerResolvedName == null;
  const gmAliasDisplayName = row.playerDisplayName?.trim() ?? "";
  const showGmAliasSubtitle =
    !isPlayerView && shouldShowGmPlayerAliasSubtitle(gmName, gmAliasDisplayName);

  const renderCharacterNameText = (primary: string, className = "") => (
    <span className={cn("flex w-full max-w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden", className)}>
      <span className="flex min-w-0 items-center gap-2">
        <TrackerLabel
          value={primary}
          className="block min-w-0 max-w-full flex-1 truncate text-base font-semibold text-white"
        />
        {isOwnCharacter ? (
          <span
            className="ml-auto shrink-0 rounded-full bg-blue/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue"
            aria-label={labels.ownCharacterLabel}>
            {labels.ownCharacterBadge}
          </span>
        ) : null}
      </span>
      {showGmAliasSubtitle ? (
        <span
          className="block w-full min-w-0 max-w-full truncate text-xs font-medium text-white/55"
          aria-label={labels.playerDisplayNameSubtitle}>
          <TrackerLabel value={gmAliasDisplayName} />
        </span>
      ) : null}
    </span>
  );

  const hasTempHp = (row.tempHitPoints ?? 0) > 0;
  const status = getInitiativeTrackerRowStatus(row);
  const isDead = status === "dead";
  const isUnconscious = status === "unconscious";
  const statusLabel = labels.getStatusLabel(status);
  const showInitiative = !isPlayerView || fieldVis.initiative;
  const showHp = !isPlayerView || fieldVis.hitPoints;
  const showLifeStatus = !isPlayerView || fieldVis.lifeStatus;
  const showAc = !isPlayerView || fieldVis.armorClass;
  const showConditions = !isPlayerView || fieldVis.conditions;
  const showConcentration = !isPlayerView || fieldVis.concentration;
  const showGroupLabel = !isPlayerView || fieldVis.groupLabel;
  const canEditConcentration = Boolean(
    battleStarted
    && onSetConcentration
    && (!isPlayerView || isOwnCharacter),
  );

  const hpCellClassName = cn(
    "flex h-9 w-full flex-col items-start justify-center gap-0 overflow-hidden tabular-nums",
    TRACKER_CELL_ALIGN.hitPoints,
    showHp && hasTempHp && "min-h-10 py-0.5",
  );
  /** Field frame only on the clickable GM hit points button (read-only values stay plain text). */
  /** Rows sit on `gray-middle-light`: fields inside them use the next lighter level (`gray`). */
  const hpFieldFrameClassName = "min-w-[5.25rem] rounded-[15px] bg-gray px-3";

  const StatusIcon = showLifeStatus && (isDead ? Skull : isUnconscious ? HeartCrack : null);
  const statusIconColor = isDead ? "text-red" : "text-yellow";

  const hidden = <HiddenFieldPlaceholder label={labels.hiddenField} />;
  const compactHidden = <HiddenFieldPlaceholder label={labels.hiddenField} compact />;
  /**
   * `alignEnd`: mobile read-only HP column, right-aligned against the chevron slot.
   * A hidden value shows its icon on the same edge as the value would (the column never shifts).
   */
  const renderHpCellContent = (alignEnd = false) => (
    <>
      <span
        className={cn(
          "flex items-center gap-1 text-sm font-medium leading-tight text-white",
          alignEnd ? "justify-end" : "justify-start",
        )}>
        {showHp ? (
          <span>
            {row.hitPoints}/{row.maxHitPoints ?? 0}
          </span>
        ) : (
          <HiddenFieldPlaceholder
            label={labels.hiddenField}
            compact
            className={alignEnd ? "justify-end" : "justify-start"}
          />
        )}
        {StatusIcon ? (
          <StatusIcon
            aria-hidden="true"
            className={`size-4 shrink-0 ${statusIconColor}`}
          />
        ) : null}
      </span>
      {showHp && hasTempHp ? (
        <span className="text-[10px] font-semibold leading-none text-blue-300">
          +{row.tempHitPoints}
          {labels.hpAbbr}
        </span>
      ) : null}
    </>
  );

  // FR-combat-initiative-tracker table layout — a colored row changes its background only (no ring);
  // the active turn background wins, the vital status stays readable through the HP icon + status text.
  const rowBackgroundClass = isActiveTurn
    ? "bg-blue/35"
    : showLifeStatus && isDead
      ? "bg-red/35"
      : showLifeStatus && isUnconscious
        ? "bg-yellow/30"
        : "bg-transparent";
  const rowEffectClass = cn(
    // FR-tracker-combatant-reveal — the only ring allowed on a tracker row (temporary, 3 s).
    isNewlyRevealed && "ring-2 ring-inset ring-green/60 animate-pulse",
    statusChangeAnimation != null && "animate-pulse motion-reduce:animate-none",
  );

  const renderCharacterNameNode = () => {
    if (showHiddenName) return hidden;

    if (isOwnCharacter && ownCharacterSheetHref) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={ownCharacterSheetHref}
              aria-label={labels.viewOwnSheet}
              className="block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
              {renderCharacterNameText(displayName)}
            </Link>
          </TooltipTrigger>
          <TooltipContent>{labels.viewOwnSheet}</TooltipContent>
        </Tooltip>
      );
    }

    if (!isPlayerView && getSheetHref) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getSheetHref(row.characterId)}
              aria-label={labels.viewSheetFor}
              className="block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
              {renderCharacterNameText(gmName)}
            </Link>
          </TooltipTrigger>
          <TooltipContent>{labels.viewSheet}</TooltipContent>
        </Tooltip>
      );
    }

    if (isPlayerView) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="block w-full max-w-full min-w-0 flex-1 basis-0 overflow-hidden cursor-not-allowed text-white/85"
              aria-disabled="true">
              {renderCharacterNameText(displayName)}
            </span>
          </TooltipTrigger>
          <TooltipContent>{labels.onlyOwnCharacterSheet}</TooltipContent>
        </Tooltip>
      );
    }

    return renderCharacterNameText(gmName);
  };

  /** `small`: mobile collapsed line (thin rows). */
  const renderAvatarThumb = (small = false) => {
    const sizeClassName = small ? "size-7" : "size-9 sm:size-10";
    // FR-combat-initiative-tracker — no image (or hidden identity): neutral profile bubble, same size.
    if (showHiddenName || !row.avatar?.trim()) {
      return (
        <span
          data-slot="tracker-avatar-placeholder"
          aria-hidden="true"
          className={cn("flex shrink-0 items-center justify-center rounded-full bg-gray", sizeClassName)}>
          <User className={cn("text-white/40", small ? "size-3.5" : "size-4")} />
        </span>
      );
    }

    if (avatarImageUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- presigned tracker thumbnail
        <img
          src={avatarImageUrl}
          alt=""
          aria-hidden="true"
          width={small ? 28 : 36}
          height={small ? 28 : 36}
          loading="lazy"
          decoding="async"
          className={cn("shrink-0 rounded-full object-cover object-center", sizeClassName)}
        />
      );
    }

    return (
      <MediaAvatar
        scope="character"
        entityId={row.characterId}
        storedValue={row.avatar}
        size="thumb"
        sessionCode={sessionCode}
        alt={displayName}
        className={small ? "size-7" : undefined}
      />
    );
  };

  const renderCharacterColumn = () => (
    <div className="flex min-w-0 w-full max-w-full items-center gap-2 overflow-hidden">
      {renderAvatarThumb()}
      <div className="min-w-0 flex-1 overflow-hidden">{renderCharacterNameNode()}</div>
    </div>
  );

  /** `detail`: mobile expanded line — the group name only, no group icon (FR-combat-initiative-tracker). */
  const renderGroupContent = (detail = false) =>
    showGroupLabel ? (
      <>
        {detail ? null : row.groupId === SESSION_PARTICIPANTS_GROUP_ID ? (
          <Users
            aria-hidden="true"
            className="size-4 shrink-0 text-white/75"
          />
        ) : (
          <Layers2
            aria-hidden="true"
            className="size-4 shrink-0 text-white/75"
          />
        )}
        {detail ? (
          <span className="block min-w-0 max-w-full break-words text-sm">{row.groupLabel}</span>
        ) : (
          <TrackerLabel
            value={row.groupLabel}
            className="block min-w-0 max-w-full truncate text-sm"
          />
        )}
      </>
    ) : isPlayerView ? (
      detail ? hidden : compactHidden
    ) : (
      <span className={cn("block min-w-0 max-w-full text-sm text-white/70", detail ? "break-words" : "truncate")}>
        {labels.otherGroup}
      </span>
    );

  const groupContent = renderGroupContent();

  const rowConditions = React.useMemo(() => row.conditions ?? [], [row.conditions]);
  const rowCustomEffects = React.useMemo(() => row.customEffects ?? [], [row.customEffects]);
  const activeConcentration =
    battleStarted && showConcentration && row.concentration ? row.concentration : null;
  const activePendingConcentrationCheck =
    battleStarted && showConcentration && activeConcentration ? row.pendingConcentrationCheck ?? null : null;
  const totalStateCount = rowConditions.length + rowCustomEffects.length + (activeConcentration ? 1 : 0);

  const formatConcentrationDetail = React.useCallback(
    (concentration: TrackerConcentration) => {
      const base = tConc("badgeDetail", { spell: concentration.spellName });
      if (!activePendingConcentrationCheck) return base;
      return `${base}. ${tConc("pendingCheck", {
        damage: activePendingConcentrationCheck.damageAmount,
        dc: activePendingConcentrationCheck.dc,
      })}`;
    },
    [activePendingConcentrationCheck, tConc],
  );

  const concentrationBadgeProps = React.useMemo(() => {
    if (!activeConcentration) return null;

    const canOpenSaveDialog = shouldShowConcentrationSaveDialog({
      row,
      isGameMaster: !isPlayerView,
      ownCharacterId,
    });

    return {
      concentration: activeConcentration,
      badgeLabel: tConc("badgeLabel"),
      badgeShort: tConc("badgeShort"),
      detailLabel: formatConcentrationDetail(activeConcentration),
      pendingCheck: activePendingConcentrationCheck,
      pendingCheckLabel: activePendingConcentrationCheck
        ? tConc("pendingCheckShort", { dc: activePendingConcentrationCheck.dc })
        : null,
      pendingCheckActivateLabel: activePendingConcentrationCheck
        ? tConc("pendingCheckActivate", { dc: activePendingConcentrationCheck.dc })
        : null,
      onPendingCheckActivate:
        canOpenSaveDialog && activePendingConcentrationCheck && onOpenConcentrationSaveDialog
          ? () => onOpenConcentrationSaveDialog(row)
          : undefined,
    };
  }, [
    activeConcentration,
    activePendingConcentrationCheck,
    formatConcentrationDetail,
    isPlayerView,
    onOpenConcentrationSaveDialog,
    ownCharacterId,
    row,
    tConc,
  ]);

  const stateSummaryLabels = React.useMemo(() => {
    const parts: string[] = [];
    if (activeConcentration) {
      parts.push(formatConcentrationDetail(activeConcentration));
    }
    if (showConditions) {
      parts.push(...rowConditions.map((entry) => labels.getConditionLabel(entry.condition)));
      parts.push(...rowCustomEffects.map((entry) => entry.name));
    }
    return parts;
  }, [activeConcentration, formatConcentrationDetail, labels, rowConditions, rowCustomEffects, showConditions]);

  const conditionContent =
    showConditions || activeConcentration
      ? stateSummaryLabels.length > 0
        ? stateSummaryLabels.join(", ")
        : showConditions
          ? "—"
          : null
      : null;

  const detailsId = `initiative-tracker-row-details-${row.id}`;
  /**
   * FR-combat-initiative-tracker — mobile: the row is expandable only when its 2nd / 3rd lines hold at least
   * one piece of information the viewer can access (hidden placeholders do not count). The GM always has the
   * display configuration button.
   */
  const hasExpandableDetails =
    !isPlayerView
    || showInitiative
    || showAc
    || showGroupLabel
    || showConditions
    || activeConcentration != null
    || canEditConcentration;
  const detailsExpanded = hasExpandableDetails && isExpanded;

  const renderInitiativeCell = (compact = false) => {
    const showModifier = !battleStarted && (!isPlayerView || isOwnCharacter);
    const modifier = Number.isFinite(row.initiativeModifier) ? Number(row.initiativeModifier) : 0;
    const modifierText = formatSignedBonus(modifier);
    const modifierAriaLabel = labels.initiativeModifierFor(modifierText);

    return (
    <div className="flex w-full min-w-0 items-center">
      {showInitiative ? (
        initiativeLocked || (isPlayerView && !isOwnCharacter) ? (
          // Not clickable: plain value, no field frame (FR-combat-initiative-tracker table layout).
          <div className="flex w-full min-w-0 flex-col items-start justify-center">
            <div
              data-slot="tracker-initiative-value"
              className={cn(
                "flex items-center text-sm font-semibold tabular-nums text-white",
                // Mobile details: plain value right under its label (no field height without a field).
                compact ? "text-base" : "h-9",
              )}
              aria-label={
                showModifier ? `${labels.initiativeFor}, ${modifierAriaLabel}` : labels.initiativeFor
              }>
              {row.initiative}
            </div>
            {showModifier ? (
              <InitiativeModifierHint
                modifierText={modifierText}
                ariaLabel={modifierAriaLabel}
              />
            ) : null}
          </div>
        ) : (
          <InitiativeNumberInput
            value={row.initiative}
            resetKey={row.id}
            align="start"
            ariaLabel={
              initiativeMissing && initiativeMissingLabel
                ? `${labels.initiativeFor}, ${initiativeMissingLabel}`
                : labels.initiativeFor
            }
            modifier={modifier}
            modifierAriaLabel={modifierAriaLabel}
            showModifier={showModifier}
            rollPlaceholder={labels.initiativeRollPlaceholder}
            totalPreviewLabel={labels.initiativeTotalPreview}
            onCommit={(nextValue) => onUpdateRow?.(row.id, { initiative: nextValue })}
            containerClassName={cn(
              compact && "max-w-none",
            )}
            className={cn(
              "h-9 rounded-[15px] bg-gray px-3 text-left text-sm text-white",
              compact && "px-2",
              // Same 1px width focused or not; neutral dashed frame marks a roll still to enter.
              initiativeMissing && "border border-dashed border-white/40 focus-within:border-solid focus-within:border-white/80",
            )}
          />
        )
      ) : (
        compactHidden
      )}
    </div>
    );
  };

  const renderHpCell = (compact = false) => (
    <div className="flex min-w-0 justify-start self-center">
      {!isPlayerView && onHitPointsClick ? (
        <button
          type="button"
          onClick={() => onHitPointsClick(row)}
          aria-label={labels.hitPointsFor}
          aria-haspopup="dialog"
          title={labels.hitPointsSessionTooltip}
          className={cn(
            hpCellClassName,
            hpFieldFrameClassName,
            // The value is centered inside its button (FR-combat-initiative-tracker table layout).
            "items-center [&>span:first-child]:justify-center",
            "cursor-pointer transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            // Clickable on mobile too: keep the field frame (like the initiative input) as affordance.
            compact && "min-w-0 [&>span:first-child]:text-base [&>span:first-child]:font-semibold",
          )}>
          {renderHpCellContent()}
        </button>
      ) : (
        <div
          className={cn(
            hpCellClassName,
            "text-sm font-medium",
            // Mobile read-only (player view): right-aligned against the chevron slot.
            compact && "items-end text-right [&>span:first-child]:text-base [&>span:first-child]:font-semibold",
          )}>
          {renderHpCellContent(compact)}
        </div>
      )}
    </div>
  );

  const renderConditionBadges = () => {
    if (!showConditions && !activeConcentration) return compactHidden;
    if (totalStateCount === 0) {
      return <span className="text-sm text-white/70">—</span>;
    }

    return (
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {concentrationBadgeProps ? (
          <div className="min-w-0 max-w-full shrink overflow-x-clip">
            <ConcentrationStateBadge
            concentration={concentrationBadgeProps.concentration}
            badgeLabel={concentrationBadgeProps.badgeLabel}
            badgeShort={concentrationBadgeProps.badgeShort}
            detailLabel={concentrationBadgeProps.detailLabel}
            pendingCheck={concentrationBadgeProps.pendingCheck}
            pendingCheckLabel={concentrationBadgeProps.pendingCheckLabel}
            pendingCheckActivateLabel={concentrationBadgeProps.pendingCheckActivateLabel}
            onPendingCheckActivate={concentrationBadgeProps.onPendingCheckActivate}
            canEdit={canEditConcentration}
            changeLabel={tConc("change")}
            dropLabel={tConc("drop")}
            onEdit={() => openConcentrationDialog("replace")}
            onRemove={() => onSetConcentration?.(row, null)}
          />
          </div>
        ) : null}
        {showConditions
          ? rowConditions.map((entry) => {
              const { Icon, badgeClassName } = CONDITION_META[entry.condition];
              const conditionLabel = labels.getConditionLabel(entry.condition);
              const durationLabel = labels.formatConditionEntryDuration(entry);
              const badgeText = durationLabel ? `${conditionLabel} (${durationLabel})` : conditionLabel;

              return (
                <ConditionBadgeHelp
                  key={entry.condition}
                  title={badgeText}
                  description={labels.getConditionDescription(entry.condition)}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                    badgeClassName,
                  )}>
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{badgeText}</span>
                </ConditionBadgeHelp>
              );
            })
          : null}
        {showConditions
          ? rowCustomEffects.map((entry) => {
              const { Icon, badgeClassName } = CUSTOM_EFFECT_META;
              const durationLabel = labels.formatConditionEntryDuration(entry);
              const badgeText = durationLabel ? `${entry.name} (${durationLabel})` : entry.name;
              return (
                <ConditionBadgeHelp
                  key={entry.effectId}
                  title={badgeText}
                  description={entry.description}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                    badgeClassName,
                  )}>
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{badgeText}</span>
                </ConditionBadgeHelp>
              );
            })
          : null}
      </div>
    );
  };

  const concentrationSelectProps =
    battleStarted && showConcentration
      ? {
          enabled: true,
          canEdit: canEditConcentration,
          concentration: row.concentration ?? null,
          pendingConcentrationCheck: activePendingConcentrationCheck,
          menuLabel: tConc("menuLabel"),
          badgeLabel: tConc("badgeLabel"),
          badgeShort: tConc("badgeShort"),
          formatDetailLabel: formatConcentrationDetail,
          formatPendingCheckShortLabel: (dc: number) => tConc("pendingCheckShort", { dc }),
          formatPendingCheckActivateLabel: (dc: number) => tConc("pendingCheckActivate", { dc }),
          changeLabel: tConc("change"),
          dropLabel: tConc("drop"),
          onOpenDialog: openConcentrationDialog,
          onOpenConcentrationSaveDialog: onOpenConcentrationSaveDialog
            ? () => onOpenConcentrationSaveDialog(row)
            : undefined,
          onSetConcentration: (concentration: TrackerConcentration | null) =>
            onSetConcentration?.(row, concentration),
        }
      : undefined;

  const renderConditionsCell = (compact = false) => (
    <div className={cn("flex min-w-0 flex-col gap-1.5", compact && "w-full")}>
        {showConditions && !isPlayerView && onAddCondition && onRemoveCondition && onClearConditions ? (
          <ConditionSelect
            row={row}
            label={labels.conditionFor}
            searchPlaceholder={labels.conditionSearchPlaceholder}
            searchClearLabel={labels.conditionSearchClear}
            clearAllConditionsLabel={labels.conditionClearAll}
            emptyText={labels.conditionSearchEmpty}
            addBackLabel={labels.conditionAddBack}
            addConfirmLabel={labels.conditionAddConfirm}
            durationEnableLabel={labels.conditionDurationEnable}
            durationAmountLabel={labels.conditionDurationAmount}
            roundHintLabel={labels.conditionRoundHint}
            getConditionLabel={labels.getConditionLabel}
            getConditionDescription={labels.getConditionDescription}
            formatConditionEntryDuration={labels.formatConditionEntryDuration}
            getConditionDurationUnits={labels.getConditionDurationUnits}
            onAddCondition={onAddCondition}
            onRemoveCondition={onRemoveCondition}
            onClearConditions={onClearConditions}
            concentration={concentrationSelectProps}
            customEffects={customEffects}
          />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            {canEditConcentration && battleStarted && showConcentration ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={labels.conditionFor}
                className="shrink-0"
                onClick={() => openConcentrationDialog("set")}>
                <Pencil
                  className="size-4 text-white/80"
                  aria-hidden="true"
                />
              </Button>
            ) : null}
            {compact ? renderConditionBadges() : conditionContent != null ? (
              <span className="block min-w-0 truncate text-sm text-white/80">{conditionContent}</span>
            ) : (
              renderConditionBadges()
            )}
          </div>
        )}
    </div>
  );

  const mobileStatLabels = {
    initiative: labels.shortStatLabels?.initiative ?? labels.visibilityDialog.fields.initiative,
    armorClass: labels.shortStatLabels?.armorClass ?? labels.visibilityDialog.fields.armorClass,
  };

  /** Same label / value cell as the character sheet facts (FR-character-statistics-card). */
  const renderMobileStat = (shortLabel: string, fullLabel: string, value: React.ReactNode) => (
    <div className={cn(FACT_CELL_CLASS, "items-start")}>
      <dt className="w-full truncate text-left text-[11px] font-semibold uppercase tracking-wide text-white/50">
        <span aria-hidden="true">{shortLabel}</span>
        <span className="sr-only">{fullLabel}</span>
      </dt>
      <dd className="w-full min-w-0">{value}</dd>
    </div>
  );

  return (
    <>
      <div
        data-slot="tracker-row"
        className={cn(
          "hidden w-full max-w-full min-w-0 items-center overflow-x-clip py-3 text-sm text-white transition-colors md:grid",
          TRACKER_GRID_GAP_CLASS,
          TRACKER_CARD_PADDING_X_CLASS,
          rowBackgroundClass,
          rowEffectClass,
        )}
        style={{ gridTemplateColumns }}
        data-status={status}
        aria-current={isActiveTurn ? "true" : undefined}
        aria-label={status === "alive" ? undefined : statusLabel}>
        <span className="sr-only">
          {statusLabel}
          {isActiveTurn ? `. ${labels.activeTurn}` : null}
        </span>
        {selectionEnabled ? (
          <Checkbox
            checked={isSelected}
            aria-label={selectRowLabel}
            onCheckedChange={(checked) => onSelectionChange?.(Boolean(checked))}
            className="size-5 cursor-pointer justify-self-start"
          />
        ) : null}

        {!isPlayerView ? (
          <TrackerGridCell align="visible">
            <VisibilityTriggerButton
              row={row}
              ariaLabel={labels.visibleFor}
              onClick={() => setVisibilityOpen(true)}
            />
          </TrackerGridCell>
        ) : null}

        <TrackerGridCell align="initiative">{renderInitiativeCell()}</TrackerGridCell>

        <TrackerGridCell align="character">
          {renderCharacterColumn()}
        </TrackerGridCell>

        <TrackerGridCell align="armorClass" className="text-sm font-semibold tabular-nums text-white/90">
          {showAc ? row.armorClass : compactHidden}
        </TrackerGridCell>

        <TrackerGridCell align="hitPoints">{renderHpCell()}</TrackerGridCell>

        <TrackerGridCell align="condition">
          {renderConditionsCell()}
        </TrackerGridCell>

        <TrackerGridCell as="span" align="group" className="flex items-center gap-2">
          {groupContent}
        </TrackerGridCell>
      </div>

      <article
        className={cn(
          "w-full max-w-full min-w-0 overflow-hidden py-2.5 text-white transition-colors md:hidden",
          TRACKER_CARD_PADDING_X_CLASS,
          rowBackgroundClass,
          rowEffectClass,
        )}
        data-status={status}
        aria-current={isActiveTurn ? "true" : undefined}
        aria-label={status === "alive" ? labels.detailsFor : `${labels.detailsFor}. ${statusLabel}`}>
        <span className="sr-only">{statusLabel}</span>
        {/* Collapsed line: selection · avatar + name (remaining width) · clickable HP without label (fixed width,
            sized for « 000/000 » plus the status icon) · chevron. */}
        <div
          data-slot="tracker-mobile-header"
          className="flex min-w-0 items-center gap-3">
          {selectionEnabled ? (
            <Checkbox
              checked={isSelected}
              aria-label={selectRowLabel}
              onCheckedChange={(checked) => onSelectionChange?.(Boolean(checked))}
              className="size-5 shrink-0 cursor-pointer"
            />
          ) : null}

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left">
            {renderAvatarThumb(true)}
            <div className="min-w-0 flex-1 overflow-hidden">{renderCharacterNameNode()}</div>
          </div>

          <div
            data-slot="tracker-mobile-hp"
            className="flex w-28 shrink-0 items-center [&>div]:w-full [&_button]:w-full [&_button]:min-w-0">
            {/* No visible label: the GM button carries its own name, the read-only value gets one for AT. */}
            {isPlayerView || !onHitPointsClick ? (
              <span className="sr-only">{labels.visibilityDialog.fields.hitPoints}</span>
            ) : null}
            {renderHpCell(true)}
          </div>

          {/* Disclosure toggle: ghost (no box), like the other expand toggles of the app. */}
          {hasExpandableDetails ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              data-slot="tracker-mobile-expand"
              aria-expanded={detailsExpanded}
              aria-controls={detailsId}
              aria-label={detailsExpanded ? labels.collapseDetails : labels.expandDetails}
              onClick={onToggleExpanded}
              className="shrink-0">
              {detailsExpanded ? (
                <ChevronDown className="size-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
            </Button>
          ) : (
            // Same room as the chevron: the HP column never shifts (FR-combat-initiative-tracker).
            <span
              aria-hidden="true"
              data-slot="tracker-mobile-expand-spacer"
              className="size-8 shrink-0"
            />
          )}
        </div>

        {hasExpandableDetails ? (
          <div
            id={detailsId}
            hidden={!detailsExpanded}
            // Mobile: no separator inside a row, spacing only (the line splits rows, not their parts).
            className="mt-3">
            {/* Second line: initiative, armor class, group, each with its label. */}
            <dl
              data-slot="tracker-mobile-stats"
              className="grid min-w-0 grid-cols-3 gap-4">
              {renderMobileStat(
                mobileStatLabels.initiative,
                labels.visibilityDialog.fields.initiative,
                renderInitiativeCell(true),
              )}
              {renderMobileStat(
                mobileStatLabels.armorClass,
                labels.visibilityDialog.fields.armorClass,
                <div className="flex items-center justify-start text-base font-semibold tabular-nums text-white">
                  {showAc ? row.armorClass : hidden}
                </div>,
              )}
              {renderMobileStat(
                labels.visibilityDialog.fields.groupLabel,
                labels.visibilityDialog.fields.groupLabel,
                <div className="flex min-w-0 items-center overflow-hidden text-sm text-white/85">
                  {renderGroupContent(true)}
                </div>,
              )}
            </dl>

            {/* Third line: display button and condition editor, icon only (accessible names kept). */}
            <div
              data-slot="tracker-mobile-actions"
              className="mt-3 flex min-w-0 items-center gap-2">
              {!isPlayerView ? (
                <VisibilityTriggerButton
                  row={row}
                  ariaLabel={labels.visibleFor}
                  onClick={() => setVisibilityOpen(true)}
                />
              ) : null}
              <div className="min-w-0 flex-1">{renderConditionsCell(true)}</div>
            </div>
          </div>
        ) : null}
      </article>

      {!isPlayerView && onUpdateRow ? (
        <InitiativeTrackerVisibilityDialog
          row={row}
          open={visibilityOpen}
          onOpenChange={setVisibilityOpen}
          labels={labels.visibilityDialog}
          onLeaveInitiative={
            onRemoveFromInitiative ? () => onRemoveFromInitiative(row.id) : undefined
          }
          onApply={(visible, playerFieldVisibility, playerDisplayName) => {
            onUpdateRow(row.id, {
              visible,
              playerFieldVisibility,
              playerDisplayName: resolvePlayerDisplayNameForSave(playerDisplayName, gmName),
            });
          }}
        />
      ) : null}

      {canEditConcentration && battleStarted && showConcentration ? (
        <ConcentrationSpellDialog
          row={row}
          open={concentrationDialogOpen}
          onOpenChange={setConcentrationDialogOpen}
          intent={concentrationDialogIntent}
          currentRound={currentRound}
          sessionCode={sessionCode}
          onSetConcentration={(concentration) => onSetConcentration?.(row, concentration)}
        />
      ) : null}
    </>
  );
}
