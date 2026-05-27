"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { InitiativeTrackerTable } from "@/components/initiativeTracker/InitiativeTrackerTable";
import { InitiativeTrackerTurnControls } from "@/components/initiativeTracker/InitiativeTrackerTurnControls";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import { characterName, sortInitiativeTrackerRows } from "@/components/initiativeTracker/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  endBattle,
  nextBattleTurn,
  previousBattleTurn,
  selectActiveTurnRowId,
  selectBattleStarted,
  selectCurrentRound,
  selectInitiativeTrackerRows,
  selectSessionCode,
  startBattle,
  updateInitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

export default function InitiativeTrackerPage() {
  const t = useTranslations("initTracker.tracker");
  const dispatch = useAppDispatch();
  const { locale } = useParams<{ locale: string }>();
  const sessionCode = useAppSelector(selectSessionCode);
  const rows = useAppSelector(selectInitiativeTrackerRows);
  const battleStarted = useAppSelector(selectBattleStarted);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const currentRound = useAppSelector(selectCurrentRound);

  const sortedRows = React.useMemo(() => sortInitiativeTrackerRows(rows), [rows]);

  const activeTurnIndex = React.useMemo(() => {
    if (!activeTurnRowId) return -1;
    return sortedRows.findIndex((row) => row.id === activeTurnRowId);
  }, [activeTurnRowId, sortedRows]);

  const canGoPrevious = battleStarted && (activeTurnIndex > 0 || currentRound > 1);

  const updateRow = (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => {
    dispatch(updateInitiativeTrackerRow({ id, changes }));
  };

  const getSheetHref = (characterId: string) => {
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(characterId)}${query}`;
  };

  const toggleCondition = (
    row: InitiativeTrackerRow,
    condition: ActiveInitiativeTrackerCondition,
    checked: boolean,
  ) => {
    const currentConditions = (row.conditions ?? []).filter(
      (value): value is ActiveInitiativeTrackerCondition => value !== "none",
    );
    const nextConditions = checked
      ? [...currentConditions, condition].filter((value, index, list) => list.indexOf(value) === index)
      : currentConditions.filter((value) => value !== condition);

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
      visibleFor: t("visibleFor", { name }),
      getConditionLabel: (condition: ActiveInitiativeTrackerCondition | "none") => t(`conditions.${condition}`),
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
          onToggleCondition={toggleCondition}
          onClearConditions={clearConditions}
          getRowLabels={getRowLabels}
          turnControls={
            <InitiativeTrackerTurnControls
              battleStarted={battleStarted}
              canGoPrevious={canGoPrevious}
              labels={{
                startCombat: t("startCombat"),
                endCombat: t("endCombat"),
                previous: t("previousTurn"),
                next: t("nextTurn"),
              }}
              onStartCombat={() => dispatch(startBattle())}
              onEndCombat={() => dispatch(endBattle())}
              onPrevious={() => dispatch(previousBattleTurn())}
              onNext={() => dispatch(nextBattleTurn())}
            />
          }
        />
      </div>
    </main>
  );
}
