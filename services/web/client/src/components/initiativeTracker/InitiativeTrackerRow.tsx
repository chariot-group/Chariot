"use client";

import Link from "next/link";
import { Layers2, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { InitiativeTrackerRow as InitiativeTrackerRowType } from "@/store/slices/sessionSlice";
import { ConditionSelect } from "./ConditionSelect";
import { SESSION_PARTICIPANTS_GROUP_ID, TRACKER_GRID_TEMPLATE_COLUMNS } from "./constants";
import type { ActiveInitiativeTrackerCondition } from "./types";
import { characterName } from "./utils";

type InitiativeTrackerRowProps = {
  row: InitiativeTrackerRowType;
  isActiveTurn?: boolean;
  initiativeLocked?: boolean;
  getSheetHref: (characterId: string) => string;
  onUpdateRow: (id: string, changes: Partial<Omit<InitiativeTrackerRowType, "id">>) => void;
  onToggleCondition: (
    row: InitiativeTrackerRowType,
    condition: ActiveInitiativeTrackerCondition,
    checked: boolean,
  ) => void;
  onClearConditions: (row: InitiativeTrackerRowType) => void;
  labels: {
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
};

export function InitiativeTrackerRow({
  row,
  isActiveTurn = false,
  initiativeLocked = false,
  getSheetHref,
  onUpdateRow,
  onToggleCondition,
  onClearConditions,
  labels,
}: InitiativeTrackerRowProps) {
  const name = characterName(row.firstname, row.lastname, row.surname);

  return (
    <div
      className={`grid items-center rounded-[22px] px-5 py-3 text-base text-white shadow-lg transition-colors ${
        isActiveTurn ? "bg-blue/35 ring-2 ring-blue/60" : "bg-gray"
      }`}
      style={{ gridTemplateColumns: TRACKER_GRID_TEMPLATE_COLUMNS }}>
      <div className="w-[88px]">
        <Input
          type="number"
          step={1}
          value={row.initiative}
          aria-label={labels.initiativeFor}
          disabled={initiativeLocked}
          readOnly={initiativeLocked}
          onChange={(event) => {
            if (initiativeLocked) return;
            const nextValue = Number.parseInt(event.target.value, 10);
            onUpdateRow(row.id, { initiative: Number.isFinite(nextValue) ? nextValue : 0 });
          }}
          className="h-9 w-full rounded-[15px] bg-gray-middle-light px-3 pr-7 text-center text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <div className="flex min-w-0 items-center pl-4 pr-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getSheetHref(row.characterId)}
              aria-label={labels.viewSheetFor}
              className="min-w-0 truncate text-base font-semibold text-white underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
              {name}
            </Link>
          </TooltipTrigger>
          <TooltipContent>{labels.viewSheet}</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex h-9 w-[58px] items-center justify-center rounded-[15px] bg-gray-middle-light text-sm font-medium">
        {row.hitPoints}
      </div>

      <div className="text-sm font-semibold text-white/90">{row.armorClass}</div>

      <ConditionSelect
        row={row}
        label={labels.conditionFor}
        searchPlaceholder={labels.conditionSearchPlaceholder}
        searchClearLabel={labels.conditionSearchClear}
        clearAllConditionsLabel={labels.conditionClearAll}
        emptyText={labels.conditionSearchEmpty}
        getConditionLabel={labels.getConditionLabel}
        onToggleCondition={onToggleCondition}
        onClearConditions={onClearConditions}
      />

      <span className="flex min-w-0 items-center gap-2 pr-4">
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
      </span>

      <Checkbox
        checked={row.visible}
        aria-label={labels.visibleFor}
        onCheckedChange={(checked) => onUpdateRow(row.id, { visible: Boolean(checked) })}
        className="size-5 cursor-pointer"
      />
    </div>
  );
}
