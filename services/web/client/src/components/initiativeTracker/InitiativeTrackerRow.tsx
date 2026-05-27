"use client";

import Link from "next/link";
import { Layers2, Users } from "lucide-react";
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
import { SESSION_PARTICIPANTS_GROUP_ID, TRACKER_GRID_TEMPLATE_COLUMNS } from "./constants";
import type { ActiveInitiativeTrackerCondition } from "./types";
import { characterName } from "./utils";

type InitiativeTrackerRowProps = {
  row: InitiativeTrackerRowType;
  isActiveTurn?: boolean;
  initiativeLocked?: boolean;
  getSheetHref: (characterId: string) => string;
  onUpdateRow: (id: string, changes: Partial<Omit<InitiativeTrackerRowType, "id">>) => void;
  onAddCondition: (
    row: InitiativeTrackerRowType,
    condition: ActiveInitiativeTrackerCondition,
    duration?: InitiativeTrackerConditionDuration,
  ) => void;
  onRemoveCondition: (row: InitiativeTrackerRowType, condition: ActiveInitiativeTrackerCondition) => void;
  onClearConditions: (row: InitiativeTrackerRowType) => void;
  onHitPointsClick?: (row: InitiativeTrackerRowType) => void;
  labels: {
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
    hitPointsFor: string;
    hitPointsSessionTooltip: string;
    hpAbbr: string;
    getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => string;
    getConditionDescription: (condition: ActiveInitiativeTrackerCondition) => string;
    formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
  };
};

export function InitiativeTrackerRow({
  row,
  isActiveTurn = false,
  initiativeLocked = false,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  onHitPointsClick,
  labels,
}: InitiativeTrackerRowProps) {
  const name = characterName(row.firstname, row.lastname, row.surname);
  const hasTempHp = (row.tempHitPoints ?? 0) > 0;
  const hpCellClassName = `flex w-full max-w-full flex-col items-center justify-center gap-0 overflow-hidden rounded-[15px] bg-gray-middle-light px-1 text-center tabular-nums ${
    hasTempHp ? "min-h-10 py-0.5" : "h-9"
  }`;

  const hpCellContent = (
    <>
      <span className="text-sm font-medium leading-tight text-white">
        {row.hitPoints}/{row.maxHitPoints ?? 0}
      </span>
      {hasTempHp ? (
        <span className="text-[10px] font-semibold leading-none text-blue-300">
          +{row.tempHitPoints}
          {labels.hpAbbr}
        </span>
      ) : null}
    </>
  );

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

      <div className="flex min-w-0 justify-center self-center">
        {onHitPointsClick ? (
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

      <div className="min-w-0 text-center text-sm font-semibold tabular-nums text-white/90">{row.armorClass}</div>

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
