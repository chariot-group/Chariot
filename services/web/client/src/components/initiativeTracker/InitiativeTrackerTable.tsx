"use client";

import * as React from "react";
import { ListOrdered } from "lucide-react";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InitiativeTrackerGroupedInitiativeBar } from "./InitiativeTrackerGroupedInitiativeBar";
import { InitiativeTrackerRow as InitiativeTrackerRowComponent } from "./InitiativeTrackerRow";
import { TRACKER_GRID_TEMPLATE_COLUMNS, TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION, PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS, TRACKER_HEADER_ALIGN } from "./constants";
import type { ActiveInitiativeTrackerCondition } from "./types";
import type { InitiativeTrackerRowStatus } from "./utils";

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
    hiddenField: string;
    otherGroup: string;
    viewOwnSheet: string;
    onlyOwnCharacterSheet: string;
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
    };
    selectRowFor: string;
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
  getRowLabels,
  activeTurnRowId = null,
  initiativeLocked = false,
  groupedInitiativeLabels,
  turnControls,
  ownCharacterId = null,
  ownCharacterSheetHref = null,
}: InitiativeTrackerTableProps) {
  const isPlayerView = mode === "player";
  const [groupedInitiativeActive, setGroupedInitiativeActive] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(() => new Set());
  const groupedInitiativeAvailable = !isPlayerView && !initiativeLocked && groupedInitiativeLabels != null;
  const selectionEnabled = groupedInitiativeAvailable && groupedInitiativeActive;
  const gridTemplateColumns = isPlayerView
    ? PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS
    : selectionEnabled
      ? TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION
      : TRACKER_GRID_TEMPLATE_COLUMNS;

  const exitGroupedInitiativeMode = React.useCallback(() => {
    setGroupedInitiativeActive(false);
    setSelectedRowIds(new Set());
  }, []);

  React.useEffect(() => {
    if (!groupedInitiativeAvailable) {
      exitGroupedInitiativeMode();
    }
  }, [groupedInitiativeAvailable, exitGroupedInitiativeMode]);

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

  const allRowsSelected = rows.length > 0 && rows.every((row) => selectedRowIds.has(row.id));
  const someRowsSelected = rows.some((row) => selectedRowIds.has(row.id));

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
            setGroupedInitiativeActive(true);
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

  return (
    <div className="w-full min-w-0">
      <div className="w-full overflow-hidden rounded-[24px] bg-card text-lg font-bold text-white shadow-xl">
        <div
          className="grid w-full items-center gap-x-3 px-5 py-3"
          style={{ gridTemplateColumns }}>
          {selectionEnabled ? (
            <Checkbox
              checked={allRowsSelected ? true : someRowsSelected ? "indeterminate" : false}
              aria-label={groupedInitiativeLabels.selectAllRows}
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
          <span className={`flex items-center justify-center gap-1.5 ${TRACKER_HEADER_ALIGN.initiative}`}>
            <span>{columnLabels.initiative}</span>
            {groupedInitiativeToggle}
          </span>
          <span className={TRACKER_HEADER_ALIGN.character}>{columnLabels.character}</span>
          <span className={TRACKER_HEADER_ALIGN.hitPoints}>{columnLabels.hitPoints}</span>
          <span className={TRACKER_HEADER_ALIGN.armorClass}>{columnLabels.armorClass}</span>
          <span className={TRACKER_HEADER_ALIGN.condition}>{columnLabels.condition}</span>
          <span className={TRACKER_HEADER_ALIGN.group}>{columnLabels.group}</span>
          {!isPlayerView ? <span className={TRACKER_HEADER_ALIGN.visible}>{columnLabels.visible}</span> : null}
        </div>

        {groupedInitiativeActive ? (
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
            initiativeLocked={initiativeLocked || isPlayerView}
            selectionEnabled={selectionEnabled}
            isSelected={selectedRowIds.has(row.id)}
            onSelectionChange={(selected) => toggleRowSelection(row.id, selected)}
            selectRowLabel={selectionEnabled ? getRowLabels(row).selectRowFor : undefined}
            gridTemplateColumns={gridTemplateColumns}
            getSheetHref={isPlayerView ? undefined : getSheetHref}
            onUpdateRow={isPlayerView ? undefined : onUpdateRow}
            onAddCondition={isPlayerView ? undefined : onAddCondition}
            onRemoveCondition={isPlayerView ? undefined : onRemoveCondition}
            onClearConditions={isPlayerView ? undefined : onClearConditions}
            onHitPointsClick={isPlayerView ? undefined : onHitPointsClick}
            onRemoveFromInitiative={isPlayerView ? undefined : onRemoveFromInitiative}
            labels={getRowLabels(row)}
          />
        ))}
      </div>

      {turnControls}
    </div>
  );
}
