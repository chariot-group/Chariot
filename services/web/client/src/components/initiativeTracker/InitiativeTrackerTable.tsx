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
import { TRACKER_GRID_TEMPLATE_COLUMNS, TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION } from "./constants";
import type { ActiveInitiativeTrackerCondition } from "./types";

type InitiativeTrackerTableProps = {
  rows: InitiativeTrackerRow[];
  columnLabels: {
    initiative: string;
    character: string;
    hitPoints: string;
    armorClass: string;
    condition: string;
    group: string;
    visible: string;
  };
  getSheetHref: (characterId: string) => string;
  onUpdateRow: (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => void;
  onAddCondition: (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    duration?: InitiativeTrackerConditionDuration,
  ) => void;
  onRemoveCondition: (row: InitiativeTrackerRow, condition: ActiveInitiativeTrackerCondition) => void;
  onClearConditions: (row: InitiativeTrackerRow) => void;
  onHitPointsClick?: (row: InitiativeTrackerRow) => void;
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
    selectRowFor: string;
    getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
    getConditionDescription: (condition: ActiveInitiativeTrackerCondition) => string;
    formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
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
};

export function InitiativeTrackerTable({
  rows,
  columnLabels,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  onHitPointsClick,
  getRowLabels,
  activeTurnRowId = null,
  initiativeLocked = false,
  groupedInitiativeLabels,
  turnControls,
}: InitiativeTrackerTableProps) {
  const [groupedInitiativeActive, setGroupedInitiativeActive] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(() => new Set());
  const groupedInitiativeAvailable = !initiativeLocked && groupedInitiativeLabels != null;
  const selectionEnabled = groupedInitiativeAvailable && groupedInitiativeActive;
  const gridTemplateColumns = selectionEnabled
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
          className="grid w-full items-center px-5 py-3"
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
          <span className="flex items-center gap-1.5">
            <span>{columnLabels.initiative}</span>
            {groupedInitiativeToggle}
          </span>
          <span>{columnLabels.character}</span>
          <span>{columnLabels.hitPoints}</span>
          <span>{columnLabels.armorClass}</span>
          <span>{columnLabels.condition}</span>
          <span>{columnLabels.group}</span>
          <span>{columnLabels.visible}</span>
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
            isActiveTurn={activeTurnRowId != null && row.id === activeTurnRowId}
            initiativeLocked={initiativeLocked}
            selectionEnabled={selectionEnabled}
            isSelected={selectedRowIds.has(row.id)}
            onSelectionChange={(selected) => toggleRowSelection(row.id, selected)}
            selectRowLabel={selectionEnabled ? getRowLabels(row).selectRowFor : undefined}
            gridTemplateColumns={gridTemplateColumns}
            getSheetHref={getSheetHref}
            onUpdateRow={onUpdateRow}
            onAddCondition={onAddCondition}
            onRemoveCondition={onRemoveCondition}
            onClearConditions={onClearConditions}
            onHitPointsClick={onHitPointsClick}
            labels={getRowLabels(row)}
          />
        ))}
      </div>

      {turnControls}
    </div>
  );
}
