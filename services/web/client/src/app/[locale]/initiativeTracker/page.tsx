"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { InitiativeTrackerHealthDialog } from "@/components/initiativeTracker/InitiativeTrackerHealthDialog";
import { InitiativeTrackerTable } from "@/components/initiativeTracker/InitiativeTrackerTable";
import { InitiativeTrackerTurnControls, type PreviousTurnState } from "@/components/initiativeTracker/InitiativeTrackerTurnControls";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import { characterName, canUndoBattleTurn, isBattleTurnLocked, buildBattleTurnKey, sortInitiativeTrackerRows } from "@/components/initiativeTracker/utils";
import {
  buildConditionEntry,
  formatRemainingConditionDuration,
} from "@/components/initiativeTracker/conditionDuration";
import { ROUND_DURATION_SECONDS } from "@/components/initiativeTracker/constants";
import type {
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
} from "@/store/slices/sessionSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  endBattle,
  nextBattleTurn,
  previousBattleTurn,
  selectActiveTurnRowId,
  selectBattleStarted,
  selectCurrentRound,
  selectTurnsWithActions,
  selectInitiativeTrackerRows,
  selectIsInSession,
  selectSessionCode,
  startBattle,
  updateInitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

export default function InitiativeTrackerPage() {
  const t = useTranslations("initTracker.tracker");
  const tBattle = useTranslations("characterDetail.battle");
  const dispatch = useAppDispatch();
  const { locale } = useParams<{ locale: string }>();
  const sessionCode = useAppSelector(selectSessionCode);
  const isInSession = useAppSelector(selectIsInSession);
  const [healthDialogRow, setHealthDialogRow] = React.useState<InitiativeTrackerRow | null>(null);
  const rows = useAppSelector(selectInitiativeTrackerRows);
  const battleStarted = useAppSelector(selectBattleStarted);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const currentRound = useAppSelector(selectCurrentRound);
  const turnsWithActions = useAppSelector(selectTurnsWithActions);

  const sortedRows = React.useMemo(() => sortInitiativeTrackerRows(rows), [rows]);

  const activeTurnIndex = React.useMemo(() => {
    if (!activeTurnRowId) return -1;
    return sortedRows.findIndex((row) => row.id === activeTurnRowId);
  }, [activeTurnRowId, sortedRows]);

  const hasPreviousTurn = activeTurnIndex > 0 || currentRound > 1;

  const previousTurnState = React.useMemo((): PreviousTurnState => {
    if (!battleStarted || !hasPreviousTurn || !activeTurnRowId) return "noPreviousTurn";

    const currentKey = buildBattleTurnKey(currentRound, activeTurnRowId);
    if (isBattleTurnLocked(currentKey, turnsWithActions)) return "currentTurnLocked";
    if (!canUndoBattleTurn(sortedRows, currentRound, activeTurnRowId, turnsWithActions)) {
      return "previousTurnBlocked";
    }

    return "available";
  }, [activeTurnRowId, battleStarted, currentRound, hasPreviousTurn, sortedRows, turnsWithActions]);

  const canGoPrevious = previousTurnState === "available";

  const updateRow = (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => {
    dispatch(updateInitiativeTrackerRow({ id, changes }));
  };

  const getSheetHref = (characterId: string) => {
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(characterId)}${query}`;
  };

  const addCondition = (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    duration?: Parameters<typeof buildConditionEntry>[1],
  ) => {
    const currentConditions = row.conditions ?? [];
    const nextConditions = [
      ...currentConditions.filter((entry) => entry.condition !== condition),
      buildConditionEntry(condition, duration),
    ];

    updateRow(row.id, { conditions: nextConditions });
  };

  const removeCondition = (row: InitiativeTrackerRow, condition: ActiveInitiativeTrackerCondition) => {
    const nextConditions = (row.conditions ?? []).filter((entry) => entry.condition !== condition);
    updateRow(row.id, { conditions: nextConditions });
  };

  const clearConditions = (row: InitiativeTrackerRow) => {
    updateRow(row.id, { conditions: [] });
  };

  const getRowLabels = (row: InitiativeTrackerRow) => {
    const name = characterName(row.firstname, row.lastname, row.surname);

    return {
      initiativeFor: t("initiativeFor", { name }),
      viewSheetFor: t("viewSheetFor", { name }),
      viewSheet: t("viewSheet"),
      conditionFor: t("conditionFor", { name }),
      conditionSearchPlaceholder: t("conditionSearchPlaceholder"),
      conditionSearchClear: t("conditionSearchClear"),
      conditionClearAll: t("conditionClearAll"),
      conditionSearchEmpty: t("conditionSearchEmpty"),
      conditionAddBack: t("conditionAddBack"),
      conditionAddConfirm: t("conditionAddConfirm"),
      conditionDurationEnable: t("conditionDurationEnable"),
      conditionDurationAmount: t("conditionDurationAmount"),
      conditionRoundHint: t("conditionRoundHint", { seconds: ROUND_DURATION_SECONDS }),
      visibleFor: t("visibleFor", { name }),
      selectRowFor: t("selectRowFor", { name }),
      hitPointsFor: t("hitPointsFor", { name }),
      hitPointsSessionTooltip: tBattle("healthPointsSessionTooltip"),
      hpAbbr: tBattle("hpAbbr"),
      getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => t(`conditions.${condition}`),
      getConditionDescription: (condition: ActiveInitiativeTrackerCondition) =>
        t(`conditionDescriptions.${condition}`),
      formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => {
        if (entry.duration?.unit === "untilCombatEnd") {
          return t("conditionDurationUntilCombatEnd");
        }

        if (entry.remainingSeconds != null) {
          return formatRemainingConditionDuration(entry.remainingSeconds, (unit, amount) =>
            t(`conditionDurationUnits.${unit}`, { amount }),
          );
        }

        return null;
      },
      getConditionDurationUnits: (): { value: InitiativeTrackerConditionDurationUnit; label: string }[] => [
        { value: "seconds", label: t("conditionDurationUnitLabels.seconds") },
        { value: "minutes", label: t("conditionDurationUnitLabels.minutes") },
        { value: "hours", label: t("conditionDurationUnitLabels.hours") },
        { value: "rounds", label: t("conditionDurationUnitLabels.rounds") },
        { value: "untilCombatEnd", label: t("conditionDurationUnitLabels.untilCombatEnd") },
      ],
    };
  };

  if (rows.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-[30px] bg-card/90 px-6 py-5 text-center shadow-xl">
          <h1 className="text-xl font-bold text-white">{t("emptyTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("emptyDescription")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto px-3 py-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3">
        {battleStarted && (
          <div className="flex justify-center">
            <div className="rounded-full bg-card px-5 py-2 text-base font-bold text-white shadow-lg">
              {t("roundIndicator", { round: currentRound })}
            </div>
          </div>
        )}

        <InitiativeTrackerTable
          rows={sortedRows}
          activeTurnRowId={battleStarted ? activeTurnRowId : null}
          initiativeLocked={battleStarted}
          columnLabels={{
            initiative: t("initiative"),
            character: t("character"),
            hitPoints: t("hitPoints"),
            armorClass: t("armorClass"),
            condition: t("condition"),
            group: t("group"),
            visible: t("visible"),
          }}
          getSheetHref={getSheetHref}
          onUpdateRow={updateRow}
          onAddCondition={addCondition}
          onRemoveCondition={removeCondition}
          onClearConditions={clearConditions}
          onHitPointsClick={isInSession ? (row) => setHealthDialogRow(row) : undefined}
          getRowLabels={getRowLabels}
          groupedInitiativeLabels={{
            enableMode: t("groupedInitiativeEnable"),
            disableMode: t("groupedInitiativeDisable"),
            getSelectedCountLabel: (count) => t("groupedInitiativeSelectedCount", { count }),
            initiativePlaceholder: t("groupedInitiativePlaceholder"),
            apply: t("groupedInitiativeApply"),
            clearSelection: t("groupedInitiativeClearSelection"),
            selectAllRows: t("selectAllRows"),
          }}
          turnControls={
            <InitiativeTrackerTurnControls
              battleStarted={battleStarted}
              canGoPrevious={canGoPrevious}
              previousTurnState={previousTurnState}
              labels={{
                startCombat: t("startCombat"),
                endCombat: t("endCombat"),
                previous: t("previousTurn"),
                next: t("nextTurn"),
                previousHintAvailable: t("previousTurnHintAvailable"),
                previousHintLocked: t("previousTurnHintLocked"),
                previousHintNoPrevious: t("previousTurnHintNoPrevious"),
                turnUndoAvailable: t("turnUndoAvailable"),
                turnCurrentLocked: t("turnCurrentLocked"),
                turnPreviousBlocked: t("turnPreviousBlocked"),
              }}
              onStartCombat={() => dispatch(startBattle())}
              onEndCombat={() => dispatch(endBattle())}
              onPrevious={() => dispatch(previousBattleTurn())}
              onNext={() => dispatch(nextBattleTurn())}
            />
          }
        />

        {isInSession ? (
          <InitiativeTrackerHealthDialog
            row={healthDialogRow}
            open={healthDialogRow != null}
            onOpenChange={(open) => {
              if (!open) {
                setHealthDialogRow(null);
              }
            }}
            sessionCode={sessionCode}
            onTrackerRowUpdate={(rowId, changes) => updateRow(rowId, changes)}
          />
        ) : null}
      </div>
    </main>
  );
}
