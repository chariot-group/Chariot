"use client";

import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";
import { InitiativeTrackerRow as InitiativeTrackerRowComponent } from "./InitiativeTrackerRow";
import { TRACKER_GRID_TEMPLATE_COLUMNS } from "./constants";
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
  onToggleCondition: (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    checked: boolean,
  ) => void;
  onClearConditions: (row: InitiativeTrackerRow) => void;
  getRowLabels: (row: InitiativeTrackerRow) => {
    initiativeFor: string;
    viewSheetFor: string;
    viewSheet: string;
    conditionFor: string;
    conditionSearchPlaceholder: string;
    conditionSearchClear: string;
    conditionClearAll: string;
    conditionSearchEmpty: string;
    visibleFor: string;
    getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
  };
  activeTurnRowId?: string | null;
  initiativeLocked?: boolean;
  turnControls?: React.ReactNode;
};

export function InitiativeTrackerTable({
  rows,
  columnLabels,
  getSheetHref,
  onUpdateRow,
  onToggleCondition,
  onClearConditions,
  getRowLabels,
  activeTurnRowId = null,
  initiativeLocked = false,
  turnControls,
}: InitiativeTrackerTableProps) {
  return (
    <div className="min-w-[1080px]">
      <div
        className="grid items-center rounded-[24px] bg-card px-5 py-3 text-lg font-bold text-white shadow-xl"
        style={{ gridTemplateColumns: TRACKER_GRID_TEMPLATE_COLUMNS }}>
        <span>{columnLabels.initiative}</span>
        <span>{columnLabels.character}</span>
        <span>{columnLabels.hitPoints}</span>
        <span>{columnLabels.armorClass}</span>
        <span>{columnLabels.condition}</span>
        <span>{columnLabels.group}</span>
        <span>{columnLabels.visible}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) => (
          <InitiativeTrackerRowComponent
            key={row.id}
            row={row}
            isActiveTurn={activeTurnRowId != null && row.id === activeTurnRowId}
            initiativeLocked={initiativeLocked}
            getSheetHref={getSheetHref}
            onUpdateRow={onUpdateRow}
            onToggleCondition={onToggleCondition}
            onClearConditions={onClearConditions}
            labels={getRowLabels(row)}
          />
        ))}
      </div>

      {turnControls}
    </div>
  );
}
