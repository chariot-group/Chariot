"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown, ChevronRight, HeartCrack, Layers2, Skull, Users } from "lucide-react";
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
import { ConditionSelect } from "@/components/initiativeTracker/ConditionSelect";
import { HiddenFieldPlaceholder } from "@/components/initiativeTracker/HiddenFieldPlaceholder";
import {
  InitiativeTrackerVisibilityDialog,
  VisibilityTriggerButton,
} from "@/components/initiativeTracker/InitiativeTrackerVisibilityDialog";
import {
  SESSION_PARTICIPANTS_GROUP_ID,
  TRACKER_CELL_ALIGN,
  TRACKER_GRID_TEMPLATE_COLUMNS,
} from "@/components/initiativeTracker/constants";
import { CONDITION_META } from "@/components/initiativeTracker/conditionMeta";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import {
  characterName,
  getInitiativeTrackerRowStatus,
  resolvePlayerDisplayNameForSave,
  resolvePlayerTrackerDisplayName,
  shouldShowGmPlayerAliasSubtitle,
  type InitiativeTrackerRowStatus,
} from "@/components/initiativeTracker/utils";
import { InitiativeNumberInput } from "@/components/initiativeTracker/InitiativeNumberInput";

type InitiativeTrackerRowProps = {
  row: InitiativeTrackerRowType;
  mode?: "gm" | "player";
  ownCharacterId?: string | null;
  ownCharacterSheetHref?: string | null;
  isActiveTurn?: boolean;
  initiativeLocked?: boolean;
  selectionEnabled?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  selectRowLabel?: string;
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
  onHitPointsClick?: (row: InitiativeTrackerRowType) => void;
  onRemoveFromInitiative?: (rowId: string) => void;
  labels: {
    initiativeFor: string;
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
        armorClass: string;
        conditions: string;
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
    formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
    getStatusLabel: (status: InitiativeTrackerRowStatus) => string;
  };
};

export function InitiativeTrackerRow({
  row,
  mode = "gm",
  ownCharacterId = null,
  ownCharacterSheetHref = null,
  isActiveTurn = false,
  initiativeLocked = false,
  selectionEnabled = false,
  isSelected = false,
  onSelectionChange,
  selectRowLabel,
  isExpanded = false,
  onToggleExpanded,
  gridTemplateColumns = TRACKER_GRID_TEMPLATE_COLUMNS,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  onHitPointsClick,
  onRemoveFromInitiative,
  labels,
}: InitiativeTrackerRowProps) {
  const isPlayerView = mode === "player";
  const fieldVis = row.playerFieldVisibility;
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);

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
        <span className="block min-w-0 max-w-full flex-1 truncate text-base font-semibold text-white" title={primary}>
          {primary}
        </span>
        {isOwnCharacter ? (
          <span
            className="shrink-0 rounded-full bg-blue/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue"
            aria-label={labels.ownCharacterLabel}>
            {labels.ownCharacterBadge}
          </span>
        ) : null}
      </span>
      {showGmAliasSubtitle ? (
        <span
          className="block w-full min-w-0 max-w-full truncate text-xs font-medium text-white/55"
          title={gmAliasDisplayName}
          aria-label={labels.playerDisplayNameSubtitle}>
          {gmAliasDisplayName}
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
  const showAc = !isPlayerView || fieldVis.armorClass;
  const showConditions = !isPlayerView || fieldVis.conditions;
  const showGroupLabel = !isPlayerView || fieldVis.groupLabel;

  const hpCellClassName = cn(
    "flex h-9 w-full min-w-[4.75rem] flex-col items-center justify-center gap-0 overflow-hidden rounded-[15px] bg-gray-middle-light px-2 tabular-nums",
    TRACKER_CELL_ALIGN.hitPoints,
    hasTempHp && "min-h-10 py-0.5",
  );

  const StatusIcon = isDead ? Skull : isUnconscious ? HeartCrack : null;
  const statusIconColor = isDead ? "text-red" : "text-yellow";

  const hidden = <HiddenFieldPlaceholder label={labels.hiddenField} />;
  const compactHidden = <HiddenFieldPlaceholder label={labels.hiddenField} compact />;

  const hpCellContent = showHp ? (
    <>
      <span className="flex items-center justify-center gap-1 text-sm font-medium leading-tight text-white">
        <span>
          {row.hitPoints}/{row.maxHitPoints ?? 0}
        </span>
        {StatusIcon ? (
          <StatusIcon
            aria-hidden="true"
            className={`size-4 shrink-0 ${statusIconColor}`}
          />
        ) : null}
      </span>
      {hasTempHp ? (
        <span className="text-[10px] font-semibold leading-none text-blue-300">
          +{row.tempHitPoints}
          {labels.hpAbbr}
        </span>
      ) : null}
    </>
  ) : (
    compactHidden
  );

  const rowBackgroundClass = isDead
    ? "bg-red/35"
    : isUnconscious
      ? "bg-yellow/30"
      : isActiveTurn
        ? "bg-blue/35"
        : "bg-gray";
  const rowRingClass = cn(
    isActiveTurn
      ? "ring-2 ring-blue/60"
      : isDead
        ? "ring-2 ring-red/60"
        : isUnconscious
          ? "ring-2 ring-yellow/60"
          : "",
    isOwnCharacter && "ring-2 ring-white/30 ring-offset-1 ring-offset-background",
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

  const renderGroupContent = (detail = false) =>
    showGroupLabel ? (
      <>
        {row.groupId === SESSION_PARTICIPANTS_GROUP_ID ? (
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
        <span
          title={row.groupLabel}
          className={cn("block min-w-0 max-w-full text-base", detail ? "break-words" : "truncate")}>
          {row.groupLabel}
        </span>
      </>
    ) : isPlayerView ? (
      detail ? hidden : compactHidden
    ) : (
      <span className={cn("block min-w-0 max-w-full text-base text-white/70", detail ? "break-words" : "truncate")}>
        {labels.otherGroup}
      </span>
    );

  const groupContent = renderGroupContent();

  const rowConditions = row.conditions ?? [];
  const conditionContent =
    showConditions && (row.conditions ?? []).length > 0
      ? (row.conditions ?? []).map((entry) => labels.getConditionLabel(entry.condition)).join(", ")
      : showConditions
        ? "—"
        : null;

  const detailsId = `initiative-tracker-row-details-${row.id}`;
  const tabletDetailsId = `initiative-tracker-row-tablet-details-${row.id}`;
  const hasTabletExpansion = rowConditions.length > 1;

  const renderInitiativeCell = (compact = false) => (
    <div className={cn("flex w-full min-w-0 items-center", !compact && TRACKER_CELL_ALIGN.initiative, hasTabletExpansion && "pl-5")}>
      {showInitiative ? (
        initiativeLocked || (isPlayerView && !isOwnCharacter) ? (
          <div
            className={cn(
              "mx-auto flex h-9 w-full max-w-[88px] items-center justify-center rounded-[15px] bg-gray-middle-light px-3 text-sm font-medium tabular-nums text-white",
              compact && "mx-0 max-w-[72px] px-2 max-[360px]:max-w-[60px]",
            )}>
            {row.initiative}
          </div>
        ) : (
          <InitiativeNumberInput
            value={row.initiative}
            resetKey={row.id}
            ariaLabel={labels.initiativeFor}
            onCommit={(nextValue) => onUpdateRow?.(row.id, { initiative: nextValue })}
            className={cn(
              "mx-auto h-9 w-full max-w-[88px] rounded-[15px] bg-gray-middle-light px-3 text-center text-sm text-white",
              compact && "mx-0 max-w-[72px] px-2 max-[360px]:max-w-[60px]",
            )}
          />
        )
      ) : (
        <div className="flex justify-center">{compactHidden}</div>
      )}
    </div>
  );

  const renderTabletExpansionButton = () =>
    hasTabletExpansion ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-expanded={isExpanded}
        aria-controls={tabletDetailsId}
        aria-label={isExpanded ? labels.collapseDetails : labels.expandDetails}
        onClick={onToggleExpanded}
        className="absolute left-2 top-1/2 hidden size-7 -translate-y-1/2 rounded-full text-white/65 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 md:inline-flex lg:hidden">
        {isExpanded ? (
          <ChevronDown className="size-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4" aria-hidden="true" />
        )}
      </Button>
    ) : null;

  const renderHpCell = (compact = false) => (
    <div className={cn("flex min-w-0 justify-center self-center", !compact && TRACKER_CELL_ALIGN.hitPoints)}>
      {!isPlayerView && onHitPointsClick ? (
        <button
          type="button"
          onClick={() => onHitPointsClick(row)}
          aria-label={labels.hitPointsFor}
          aria-haspopup="dialog"
          title={labels.hitPointsSessionTooltip}
          className={cn(
            hpCellClassName,
            "cursor-pointer transition-colors hover:bg-gray-middle-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            compact && "min-w-[5.25rem]",
          )}>
          {hpCellContent}
        </button>
      ) : (
        <div className={cn(hpCellClassName, "text-sm font-medium", compact && "min-w-[5.25rem]")}>
          {hpCellContent}
        </div>
      )}
    </div>
  );

  const renderConditionBadges = () => {
    if (!showConditions) return compactHidden;
    if (rowConditions.length === 0) {
      return <span className="text-sm text-white/70">—</span>;
    }

    return (
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {rowConditions.map((entry) => {
          const { Icon, badgeClassName } = CONDITION_META[entry.condition];
          const conditionLabel = labels.getConditionLabel(entry.condition);
          const durationLabel = labels.formatConditionEntryDuration(entry);
          const badgeText = durationLabel ? `${conditionLabel} (${durationLabel})` : conditionLabel;

          return (
            <span
              key={entry.condition}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium",
                badgeClassName,
              )}
              title={badgeText}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">{badgeText}</span>
            </span>
          );
        })}
      </div>
    );
  };

  const renderConditionsCell = (compact = false) => (
    <div className={cn("min-w-0 overflow-hidden", !compact && TRACKER_CELL_ALIGN.condition, compact && "w-full")}>
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
        />
      ) : compact ? (
        renderConditionBadges()
      ) : conditionContent != null ? (
        <span className="block min-w-0 truncate text-sm text-white/80">{conditionContent}</span>
      ) : (
        compactHidden
      )}
    </div>
  );

  const renderDetailItem = (label: string, value: React.ReactNode) => (
    <div className="min-w-0 rounded-[15px] bg-black/10 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase text-white/45">{label}</dt>
      <dd className="mt-1 min-w-0 break-words text-sm font-medium text-white/85">{value}</dd>
    </div>
  );

  return (
    <>
      <div
        className={`relative hidden w-full max-w-full min-w-0 items-center gap-x-2 rounded-[22px] py-3 pr-3 text-sm text-white shadow-lg transition-colors lg:gap-x-3 lg:px-5 lg:text-base md:grid ${hasTabletExpansion ? "pl-5 lg:pl-5" : "pl-3 lg:pl-5"
          } ${rowBackgroundClass} ${rowRingClass}`}
        style={{ gridTemplateColumns }}
        data-status={status}
        aria-label={status === "alive" ? undefined : statusLabel}>
        <span className="sr-only">{statusLabel}</span>
        {renderTabletExpansionButton()}
        {selectionEnabled ? (
          <Checkbox
            checked={isSelected}
            aria-label={selectRowLabel}
            onCheckedChange={(checked) => onSelectionChange?.(Boolean(checked))}
            className="size-5 cursor-pointer justify-self-center"
          />
        ) : null}

        {renderInitiativeCell()}

        <div className={`flex w-full max-w-full min-w-0 overflow-hidden ${TRACKER_CELL_ALIGN.character}`}>
          {renderCharacterNameNode()}
        </div>

        {renderHpCell()}

        <div className={`min-w-0 text-sm font-semibold tabular-nums text-white/90 ${TRACKER_CELL_ALIGN.armorClass}`}>
          {showAc ? row.armorClass : compactHidden}
        </div>

        {renderConditionsCell()}

        <span className={`flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden ${TRACKER_CELL_ALIGN.group}`}>
          {groupContent}
        </span>

        {!isPlayerView ? (
          <div className={TRACKER_CELL_ALIGN.visible}>
            <VisibilityTriggerButton
              row={row}
              ariaLabel={labels.visibleFor}
              onClick={() => setVisibilityOpen(true)}
            />
          </div>
        ) : null}
      </div>

      <div
        id={tabletDetailsId}
        hidden={!isExpanded || !hasTabletExpansion}
        className="hidden rounded-[18px] bg-card/95 p-3 text-white shadow-lg ring-1 ring-white/10 md:block lg:hidden">
        <div className="grid min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-3">
          <div className="min-w-0 rounded-[15px] bg-black/10 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-white/45">
              {labels.visibilityDialog.fields.conditions}
            </p>
            <div className="mt-2 min-w-0">{renderConditionBadges()}</div>
          </div>
          <div className="min-w-0 rounded-[15px] bg-black/10 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-white/45">
              {labels.visibilityDialog.fields.groupLabel}
            </p>
            <div className="mt-2 flex min-w-0 items-start gap-2 overflow-hidden text-sm text-white/85">
              {renderGroupContent(true)}
            </div>
          </div>
        </div>
      </div>

      <article
        className={cn(
          "w-full max-w-full min-w-0 overflow-hidden rounded-[20px] px-3 py-3 text-white shadow-lg transition-colors md:hidden",
          rowBackgroundClass,
          rowRingClass,
        )}
        data-status={status}
        aria-label={status === "alive" ? labels.detailsFor : `${labels.detailsFor}. ${statusLabel}`}>
        <span className="sr-only">{statusLabel}</span>
        <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] gap-x-2 gap-y-2">
          <div className="flex min-w-0 items-start">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-expanded={isExpanded}
              aria-controls={detailsId}
              aria-label={isExpanded ? labels.collapseDetails : labels.expandDetails}
              onClick={onToggleExpanded}
              className="size-9 shrink-0 rounded-[12px] text-white/75 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40">
              {isExpanded ? (
                <ChevronDown className="size-5" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-5" aria-hidden="true" />
              )}
            </Button>
          </div>

          <div className="min-w-0 max-w-full overflow-hidden pt-1 text-left">
            {renderCharacterNameNode()}
          </div>

          <div className="flex min-w-0 flex-col items-end gap-1">
            {isActiveTurn ? (
              <span className="max-w-[5.5rem] truncate rounded-full bg-blue/20 px-2 py-0.5 text-[10px] font-semibold text-blue">
                {labels.activeTurn}
              </span>
            ) : null}
            {!isPlayerView ? (
              <VisibilityTriggerButton
                row={row}
                ariaLabel={labels.visibleFor}
                onClick={() => setVisibilityOpen(true)}
              />
            ) : null}
          </div>

          {selectionEnabled ? (
            <div className="col-span-3 flex min-w-0 justify-start">
              <Checkbox
                checked={isSelected}
                aria-label={selectRowLabel}
                onCheckedChange={(checked) => onSelectionChange?.(Boolean(checked))}
                className="size-5 shrink-0 cursor-pointer"
              />
            </div>
          ) : null}

          <div className="col-span-3 grid min-w-0 grid-cols-[minmax(4.25rem,0.75fr)_minmax(6.25rem,1fr)_minmax(3.25rem,0.55fr)] gap-2">
            <div className="min-w-0 rounded-[15px] bg-gray-middle-light/45 px-2 py-2">
              <span className="mb-1 block truncate text-[10px] font-semibold uppercase text-white/45">
                {labels.visibilityDialog.fields.initiative}
              </span>
              {renderInitiativeCell(true)}
            </div>

            <div className="min-w-0 rounded-[15px] bg-gray-middle-light/45 px-2 py-2">
              <span className="mb-1 block truncate text-[10px] font-semibold uppercase text-white/45">
                {labels.visibilityDialog.fields.hitPoints}
              </span>
              {renderHpCell(true)}
            </div>

            <div className="min-w-0 rounded-[15px] bg-gray-middle-light/45 px-2 py-2">
              <span className="mb-1 block truncate text-[10px] font-semibold uppercase text-white/45">
                {labels.visibilityDialog.fields.armorClass}
              </span>
              <div className="flex h-9 items-center justify-center rounded-[15px] bg-gray-middle-light px-2 text-sm font-semibold tabular-nums text-white">
                {showAc ? row.armorClass : hidden}
              </div>
            </div>
          </div>
        </div>

        <div
          id={detailsId}
          hidden={!isExpanded}
          className="mt-3 rounded-[15px] bg-gray-middle-light/40 p-3">
          <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {renderDetailItem(
              labels.visibilityDialog.fields.groupLabel,
              <span className="flex min-w-0 items-start gap-2 overflow-hidden">{renderGroupContent(true)}</span>,
            )}
            {showGmAliasSubtitle
              ? renderDetailItem(labels.playerDisplayNameSubtitle, gmAliasDisplayName)
              : null}
          </dl>

          <div className="mt-2 rounded-[15px] bg-black/10 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-white/45">
              {labels.visibilityDialog.fields.conditions}
            </p>
            <div className="mt-2 min-w-0">{renderConditionsCell(true)}</div>
          </div>
        </div>
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
    </>
  );
}
