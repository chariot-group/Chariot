"use client";

import Link from "next/link";
import * as React from "react";
import { HeartCrack, Layers2, Skull, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow as InitiativeTrackerRowType,
} from "@/store/slices/sessionSlice";
import { ConditionSelect } from "./ConditionSelect";
import { HiddenFieldPlaceholder } from "./HiddenFieldPlaceholder";
import {
  InitiativeTrackerVisibilityDialog,
  VisibilityTriggerButton,
} from "./InitiativeTrackerVisibilityDialog";
import {
  SESSION_PARTICIPANTS_GROUP_ID,
  TRACKER_CELL_ALIGN,
  TRACKER_GRID_TEMPLATE_COLUMNS,
} from "./constants";
import type { ActiveInitiativeTrackerCondition } from "./types";
import {
  characterName,
  getInitiativeTrackerRowStatus,
  resolvePlayerDisplayNameForSave,
  resolvePlayerTrackerDisplayName,
  shouldShowGmPlayerAliasSubtitle,
  type InitiativeTrackerRowStatus,
} from "./utils";
import { InitiativeNumberInput } from "./InitiativeNumberInput";

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
    hitPointsFor: string;
    hitPointsSessionTooltip: string;
    hpAbbr: string;
    hiddenField: string;
    otherGroup: string;
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
  const showGmAliasSubtitle =
    !isPlayerView && shouldShowGmPlayerAliasSubtitle(gmName, row.playerDisplayName ?? "");

  const renderCharacterNameText = (primary: string, className: string) => (
    <span className={`flex min-w-0 flex-col ${className}`}>
      <span className="min-w-0 truncate text-base font-semibold text-white">{primary}</span>
      {showGmAliasSubtitle ? (
        <span
          className="min-w-0 truncate text-xs font-medium text-white/55"
          title={labels.playerDisplayNameSubtitle}>
          {row.playerDisplayName.trim()}
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

  const hpCellClassName = `flex h-9 w-full min-w-[4.75rem] flex-col items-center justify-center gap-0 overflow-hidden rounded-[15px] bg-gray-middle-light px-2 tabular-nums ${TRACKER_CELL_ALIGN.hitPoints} ${
    hasTempHp ? "min-h-10 py-0.5" : ""
  }`;

  const StatusIcon = isDead ? Skull : isUnconscious ? HeartCrack : null;
  const statusIconColor = isDead ? "text-red" : "text-yellow";

  const hidden = <HiddenFieldPlaceholder label={labels.hiddenField} />;

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
    hidden
  );

  const rowBackgroundClass = isDead
    ? "bg-red/35"
    : isUnconscious
      ? "bg-yellow/30"
      : isActiveTurn
        ? "bg-blue/35"
        : "bg-gray";
  const rowRingClass = isActiveTurn
    ? "ring-2 ring-blue/60"
    : isDead
      ? "ring-2 ring-red/60"
      : isUnconscious
        ? "ring-2 ring-yellow/60"
        : "";

  const characterNameNode = showHiddenName ? (
    hidden
  ) : isOwnCharacter && ownCharacterSheetHref ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={ownCharacterSheetHref}
          aria-label={labels.viewOwnSheet}
          className="min-w-0 underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          {renderCharacterNameText(displayName, "")}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{labels.viewOwnSheet}</TooltipContent>
    </Tooltip>
  ) : !isPlayerView && getSheetHref ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={getSheetHref(row.characterId)}
          aria-label={labels.viewSheetFor}
          className="min-w-0 underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          {renderCharacterNameText(gmName, "")}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{labels.viewSheet}</TooltipContent>
    </Tooltip>
  ) : isPlayerView ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="min-w-0 cursor-not-allowed text-white/85"
          aria-disabled="true">
          {renderCharacterNameText(displayName, "")}
        </span>
      </TooltipTrigger>
      <TooltipContent>{labels.onlyOwnCharacterSheet}</TooltipContent>
    </Tooltip>
  ) : (
    renderCharacterNameText(gmName, "")
  );

  const groupContent = showGroupLabel ? (
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
        className="truncate text-base">
        {row.groupLabel}
      </span>
    </>
  ) : (
    <span className="truncate text-base text-white/70">{labels.otherGroup}</span>
  );

  const conditionContent =
    showConditions && (row.conditions ?? []).length > 0
      ? (row.conditions ?? []).map((entry) => labels.getConditionLabel(entry.condition)).join(", ")
      : showConditions
        ? "—"
        : null;

  return (
    <>
      <div
        className={`grid w-full min-w-0 items-center gap-x-3 rounded-[22px] px-5 py-3 text-base text-white shadow-lg transition-colors ${rowBackgroundClass} ${rowRingClass}`}
        style={{ gridTemplateColumns }}
        data-status={status}
        aria-label={status === "alive" ? undefined : statusLabel}>
        <span className="sr-only">{statusLabel}</span>
        {selectionEnabled ? (
          <Checkbox
            checked={isSelected}
            aria-label={selectRowLabel}
            onCheckedChange={(checked) => onSelectionChange?.(Boolean(checked))}
            className="size-5 cursor-pointer justify-self-center"
          />
        ) : null}

        <div className={`w-full ${TRACKER_CELL_ALIGN.initiative}`}>
          {showInitiative ? (
            isPlayerView || initiativeLocked ? (
              <div className="mx-auto flex h-9 w-full max-w-[88px] items-center justify-center rounded-[15px] bg-gray-middle-light px-3 text-sm font-medium tabular-nums text-white">
                {row.initiative}
              </div>
            ) : (
              <InitiativeNumberInput
                value={row.initiative}
                resetKey={row.id}
                ariaLabel={labels.initiativeFor}
                onCommit={(nextValue) => onUpdateRow?.(row.id, { initiative: nextValue })}
                className="mx-auto h-9 w-full max-w-[88px] rounded-[15px] bg-gray-middle-light px-3 text-center text-sm text-white"
              />
            )
          ) : (
            <div className="flex justify-center">{hidden}</div>
          )}
        </div>

        <div className={`flex min-w-0 items-center ${TRACKER_CELL_ALIGN.character}`}>{characterNameNode}</div>

        <div className={`flex min-w-0 justify-center self-center ${TRACKER_CELL_ALIGN.hitPoints}`}>
          {!isPlayerView && onHitPointsClick ? (
            <button
              type="button"
              onClick={() => onHitPointsClick(row)}
              aria-label={labels.hitPointsFor}
              aria-haspopup="dialog"
              title={labels.hitPointsSessionTooltip}
              className={`${hpCellClassName} cursor-pointer transition-colors hover:bg-gray-middle-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}>
              {hpCellContent}
            </button>
          ) : (
            <div className={`${hpCellClassName} text-sm font-medium`}>{hpCellContent}</div>
          )}
        </div>

        <div className={`min-w-0 text-sm font-semibold tabular-nums text-white/90 ${TRACKER_CELL_ALIGN.armorClass}`}>
          {showAc ? row.armorClass : hidden}
        </div>

        <div className={`min-w-0 ${TRACKER_CELL_ALIGN.condition}`}>
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
          ) : conditionContent != null ? (
            <span className="block truncate text-sm text-white/80">{conditionContent}</span>
          ) : (
            hidden
          )}
        </div>

        <span className={`flex min-w-0 items-center gap-2 ${TRACKER_CELL_ALIGN.group}`}>{groupContent}</span>

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

      {!isPlayerView && onUpdateRow ? (
        <InitiativeTrackerVisibilityDialog
          row={row}
          characterName={gmName}
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
