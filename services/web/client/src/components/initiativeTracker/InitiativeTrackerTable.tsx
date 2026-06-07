"use client";

import * as React from "react";
import { ListOrdered, MonitorCog } from "lucide-react";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerPlayerFieldVisibility,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InitiativeTrackerBulkVisibilityDialog } from "@/components/initiativeTracker/InitiativeTrackerBulkVisibilityDialog";
import { InitiativeTrackerGroupedInitiativeBar } from "@/components/initiativeTracker/InitiativeTrackerGroupedInitiativeBar";
import { InitiativeTrackerRow as InitiativeTrackerRowComponent } from "@/components/initiativeTracker/InitiativeTrackerRow";
import {
  TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION,
  PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_HEADER_ALIGN,
} from "@/components/initiativeTracker/constants";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import type { InitiativeTrackerRowStatus } from "@/components/initiativeTracker/utils";

type InitiativeTrackerTableProps = {
  rows: InitiativeTrackerRow[];
  mode?: "gm" | "player";
  columnLabels: {
    initiative: string;
    character: string;
    hitPoints: string;
    armorClass: string;
    condition: string;
    group: string;
    visible: string;
  };
  getSheetHref?: (characterId: string) => string;
  onUpdateRow?: (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => void;
  onAddCondition?: (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    duration?: InitiativeTrackerConditionDuration,
  ) => void;
  onRemoveCondition?: (row: InitiativeTrackerRow, condition: ActiveInitiativeTrackerCondition) => void;
  onClearConditions?: (row: InitiativeTrackerRow) => void;
  onHitPointsClick?: (row: InitiativeTrackerRow) => void;
  onRemoveFromInitiative?: (rowId: string) => void;
  onRemoveMultipleFromInitiative?: (rowIds: string[]) => void;
  onUpdateMultipleRows?: (
    rowIds: string[],
    changes: Partial<Omit<InitiativeTrackerRow, "id" | "playerDisplayName">>,
    playerDisplayName?: string,
  ) => void;
  getRowLabels: (row: InitiativeTrackerRow) => {
    initiativeFor: string;
    viewSheetFor: string;
    viewSheet: string;
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
    viewOwnSheet: string;
    onlyOwnCharacterSheet: string;
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
    selectRowFor: string;
    selectRowForVisibility: string;
    getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
    getConditionDescription: (condition: ActiveInitiativeTrackerCondition) => string;
    formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
    getStatusLabel: (status: InitiativeTrackerRowStatus) => string;
  };
  activeTurnRowId?: string | null;
  initiativeLocked?: boolean;
  groupedInitiativeLabels?: {
    enableMode: string;
    disableMode: string;
    getSelectedCountLabel: (count: number) => string;
    initiativePlaceholder: string;
    apply: string;
    clearSelection: string;
    selectAllRows: string;
  };
  bulkVisibilityLabels?: {
    enableMode: string;
    disableMode: string;
    getSelectedCountLabel: (count: number) => string;
    selectAllRows: string;
    clearSelection: string;
    title: string;
    description: string;
    showToPlayers: string;
    playerDisplayName: string;
    playerDisplayNameHint: string;
    playerDisplayNamePlaceholder: string;
    fieldsTitle: string;
    emptySelection: string;
    apply: string;
    cancel: string;
    leaveInitiative: string;
    fields: {
      initiative: string;
      name: string;
      hitPoints: string;
      armorClass: string;
      conditions: string;
      groupLabel: string;
    };
  };
  turnControls?: React.ReactNode;
  ownCharacterId?: string | null;
  ownCharacterSheetHref?: string | null;
};

export function InitiativeTrackerTable({
  rows,
  mode = "gm",
  columnLabels,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  onHitPointsClick,
  onRemoveFromInitiative,
  onRemoveMultipleFromInitiative,
  onUpdateMultipleRows,
  getRowLabels,
  activeTurnRowId = null,
  initiativeLocked = false,
  groupedInitiativeLabels,
  bulkVisibilityLabels,
  turnControls,
  ownCharacterId = null,
  ownCharacterSheetHref = null,
}: InitiativeTrackerTableProps) {
  const isPlayerView = mode === "player";
  const [selectionMode, setSelectionMode] = React.useState<"initiative" | "visibility" | null>(null);
  const [bulkVisibilityOpen, setBulkVisibilityOpen] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(() => new Set());
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string>>(() => new Set());
  const groupedInitiativeAvailable = !isPlayerView && !initiativeLocked && groupedInitiativeLabels != null;
  const bulkVisibilityAvailable = !isPlayerView && bulkVisibilityLabels != null;
  const selectionEnabled = selectionMode != null;
  const groupedInitiativeActive = selectionMode === "initiative";
  const bulkVisibilityActive = selectionMode === "visibility";
  const gridTemplateColumns = isPlayerView
    ? PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS
    : selectionEnabled
      ? TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION
      : TRACKER_GRID_TEMPLATE_COLUMNS;

  const exitGroupedInitiativeMode = React.useCallback(() => {
    setSelectionMode(null);
    setSelectedRowIds(new Set());
  }, []);

  const exitBulkVisibilityMode = React.useCallback(() => {
    setSelectionMode(null);
    setSelectedRowIds(new Set());
    setBulkVisibilityOpen(false);
  }, []);

  const toggleRowSelection = (rowId: string, selected: boolean) => {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  };

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRowIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const allRowsSelected = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.id));
  const someRowsSelected = rows.some((row) => selectedRowIds.has(row.id));
  const selectAllRowsLabel = bulkVisibilityActive
    ? bulkVisibilityLabels?.selectAllRows
    : groupedInitiativeLabels?.selectAllRows;

  const applyGroupedInitiative = (initiative: number) => {
    if (!onUpdateRow) return;
    selectedRowIds.forEach((rowId) => {
      onUpdateRow(rowId, { initiative });
    });
    exitGroupedInitiativeMode();
  };

  const groupedInitiativeToggle = groupedInitiativeAvailable ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={groupedInitiativeActive}
          aria-label={
            groupedInitiativeActive
              ? groupedInitiativeLabels.disableMode
              : groupedInitiativeLabels.enableMode
          }
          onClick={() => {
            if (groupedInitiativeActive) {
              exitGroupedInitiativeMode();
              return;
            }
            setSelectionMode("initiative");
          }}
          className={cn(
            "size-7 shrink-0 text-white/45 hover:bg-white/10 hover:text-white/80",
            groupedInitiativeActive && "bg-white/10 text-blue",
          )}>
          <ListOrdered className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {groupedInitiativeActive
          ? groupedInitiativeLabels.disableMode
          : groupedInitiativeLabels.enableMode}
      </TooltipContent>
    </Tooltip>
  ) : null;

  const bulkVisibilityToggle = bulkVisibilityAvailable ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={bulkVisibilityActive}
          aria-label={
            bulkVisibilityActive
              ? bulkVisibilityLabels.disableMode
              : bulkVisibilityLabels.enableMode
          }
          onClick={() => {
            if (bulkVisibilityActive) {
              exitBulkVisibilityMode();
              return;
            }
            setSelectionMode("visibility");
          }}
          className={cn(
            "size-7 shrink-0 text-white/45 hover:bg-white/10 hover:text-white/80",
            bulkVisibilityActive && "bg-white/10 text-green",
          )}>
          <MonitorCog className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {bulkVisibilityActive
          ? bulkVisibilityLabels.disableMode
          : bulkVisibilityLabels.enableMode}
      </TooltipContent>
    </Tooltip>
  ) : null;

  return (
    <div className="w-full min-w-0">
      {bulkVisibilityAvailable ? (
        <div className="mb-2 flex min-w-0 justify-end md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={bulkVisibilityActive}
            className="max-w-full gap-2 rounded-[15px]"
            onClick={() => {
              if (bulkVisibilityActive) {
                exitBulkVisibilityMode();
                return;
              }
              setSelectionMode("visibility");
            }}>
            <MonitorCog className="size-4" aria-hidden="true" />
            <span className="min-w-0 truncate">
              {bulkVisibilityActive
                ? bulkVisibilityLabels.disableMode
                : bulkVisibilityLabels.enableMode}
            </span>
          </Button>
        </div>
      ) : null}

      <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-[24px] bg-card text-sm font-bold text-white shadow-xl lg:text-lg md:block">
        <div
          className="grid w-full max-w-full min-w-0 items-center gap-x-2 px-3 py-3 lg:gap-x-3 lg:px-5"
          style={{ gridTemplateColumns }}>
          {selectionEnabled ? (
            <Checkbox
              checked={allRowsSelected ? true : someRowsSelected ? "indeterminate" : false}
              aria-label={selectAllRowsLabel ?? ""}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  setSelectedRowIds(new Set(rows.map((row) => row.id)));
                  return;
                }
                setSelectedRowIds(new Set());
              }}
              className="size-5 cursor-pointer justify-self-center"
            />
          ) : null}
          <span className={`flex min-w-0 items-center justify-center gap-1.5 ${TRACKER_HEADER_ALIGN.initiative}`}>
            <span className="min-w-0 truncate">{columnLabels.initiative}</span>
            {groupedInitiativeToggle}
          </span>
          <span className={`min-w-0 truncate ${TRACKER_HEADER_ALIGN.character}`}>{columnLabels.character}</span>
          <span className={`min-w-0 truncate ${TRACKER_HEADER_ALIGN.hitPoints}`}>{columnLabels.hitPoints}</span>
          <span className={`min-w-0 truncate ${TRACKER_HEADER_ALIGN.armorClass}`}>{columnLabels.armorClass}</span>
          <span className={`min-w-0 truncate ${TRACKER_HEADER_ALIGN.condition}`}>{columnLabels.condition}</span>
          <span className={`min-w-0 truncate ${TRACKER_HEADER_ALIGN.group}`}>{columnLabels.group}</span>
          {!isPlayerView ? (
            <span className={`flex min-w-0 items-center justify-center gap-1.5 ${TRACKER_HEADER_ALIGN.visible}`}>
              <span className="min-w-0 truncate">{columnLabels.visible}</span>
              {bulkVisibilityToggle}
            </span>
          ) : null}
        </div>

        {groupedInitiativeActive && groupedInitiativeLabels ? (
          <div className="w-full border-t border-white/10 px-5 py-2.5">
            <InitiativeTrackerGroupedInitiativeBar
              active={groupedInitiativeActive}
              canApply={selectedRowIds.size > 0}
              labels={{
                selectedCount: groupedInitiativeLabels.getSelectedCountLabel(selectedRowIds.size),
                initiativePlaceholder: groupedInitiativeLabels.initiativePlaceholder,
                apply: groupedInitiativeLabels.apply,
                clearSelection: groupedInitiativeLabels.clearSelection,
              }}
              onApply={applyGroupedInitiative}
              onClearSelection={() => setSelectedRowIds(new Set())}
            />
          </div>
        ) : null}

        {bulkVisibilityActive && bulkVisibilityLabels ? (
          <div className="w-full border-t border-white/10 px-5 py-2.5">
            <div
              className="flex min-w-0 flex-col gap-2 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between"
              role="status">
              <span className="min-w-0 truncate font-semibold">
                {bulkVisibilityLabels.getSelectedCountLabel(selectedRowIds.size)}
              </span>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={selectedRowIds.size === 0}
                  onClick={() => setSelectedRowIds(new Set())}>
                  {bulkVisibilityLabels.clearSelection}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setBulkVisibilityOpen(true)}>
                  {bulkVisibilityLabels.apply}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex w-full min-w-0 flex-col gap-2.5">
        {rows.map((row) => (
          <InitiativeTrackerRowComponent
            key={row.id}
            row={row}
            mode={mode}
            ownCharacterId={ownCharacterId}
            ownCharacterSheetHref={ownCharacterSheetHref}
            isActiveTurn={activeTurnRowId != null && row.id === activeTurnRowId}
            initiativeLocked={initiativeLocked}
            selectionEnabled={selectionEnabled}
            isSelected={selectedRowIds.has(row.id)}
            onSelectionChange={(selected) => toggleRowSelection(row.id, selected)}
            selectRowLabel={
              selectionEnabled
                ? bulkVisibilityActive
                  ? getRowLabels(row).selectRowForVisibility
                  : getRowLabels(row).selectRowFor
                : undefined
            }
            isExpanded={expandedRowIds.has(row.id)}
            onToggleExpanded={() => toggleRowExpanded(row.id)}
            gridTemplateColumns={gridTemplateColumns}
            getSheetHref={isPlayerView ? undefined : getSheetHref}
            onUpdateRow={onUpdateRow}
            onAddCondition={isPlayerView ? undefined : onAddCondition}
            onRemoveCondition={isPlayerView ? undefined : onRemoveCondition}
            onClearConditions={isPlayerView ? undefined : onClearConditions}
            onHitPointsClick={isPlayerView ? undefined : onHitPointsClick}
            onRemoveFromInitiative={isPlayerView ? undefined : onRemoveFromInitiative}
            labels={getRowLabels(row)}
          />
        ))}
      </div>

      {bulkVisibilityActive && bulkVisibilityLabels ? (
        <div className="mt-3 rounded-[18px] bg-card/95 px-3 py-3 text-sm text-white shadow-lg ring-1 ring-white/10 md:hidden">
          <div
            className="flex min-w-0 flex-col gap-2"
            role="status">
            <span className="min-w-0 truncate font-semibold">
              {bulkVisibilityLabels.getSelectedCountLabel(selectedRowIds.size)}
            </span>
            <div className="flex min-w-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedRowIds.size === 0}
                onClick={() => setSelectedRowIds(new Set())}>
                {bulkVisibilityLabels.clearSelection}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setBulkVisibilityOpen(true)}>
                {bulkVisibilityLabels.apply}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkVisibilityLabels ? (
        <InitiativeTrackerBulkVisibilityDialog
          open={bulkVisibilityOpen}
          selectedCount={selectedRowIds.size}
          labels={{
            title: bulkVisibilityLabels.title,
            description: bulkVisibilityLabels.description,
            showToPlayers: bulkVisibilityLabels.showToPlayers,
            playerDisplayName: bulkVisibilityLabels.playerDisplayName,
            playerDisplayNameHint: bulkVisibilityLabels.playerDisplayNameHint,
            playerDisplayNamePlaceholder: bulkVisibilityLabels.playerDisplayNamePlaceholder,
            fieldsTitle: bulkVisibilityLabels.fieldsTitle,
            emptySelection: bulkVisibilityLabels.emptySelection,
            apply: bulkVisibilityLabels.apply,
            cancel: bulkVisibilityLabels.cancel,
            leaveInitiative: bulkVisibilityLabels.leaveInitiative,
            fields: bulkVisibilityLabels.fields,
          }}
          onOpenChange={setBulkVisibilityOpen}
          onLeaveInitiative={() => {
            onRemoveMultipleFromInitiative?.([...selectedRowIds]);
            exitBulkVisibilityMode();
          }}
          onApply={(visible, playerFieldVisibility: InitiativeTrackerPlayerFieldVisibility, playerDisplayName) => {
            onUpdateMultipleRows?.(
              [...selectedRowIds],
              { visible, playerFieldVisibility },
              playerDisplayName.length > 0 ? playerDisplayName : undefined,
            );
            exitBulkVisibilityMode();
          }}
        />
      ) : null}

      {turnControls}
    </div>
  );
}
