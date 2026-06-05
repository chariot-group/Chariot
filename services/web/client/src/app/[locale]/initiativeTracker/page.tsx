"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCombatantsDialog } from "@/components/dialogs/AddCombatantsDialog";
import { InitiativeTrackerHealthDialog } from "@/components/initiativeTracker/InitiativeTrackerHealthDialog";
import { InitiativeTrackerTable } from "@/components/initiativeTracker/InitiativeTrackerTable";
import { InitiativeTrackerTurnControls, type PreviousTurnState } from "@/components/initiativeTracker/InitiativeTrackerTurnControls";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import {
  characterName,
  canUndoBattleTurn,
  isBattleTurnLocked,
  buildBattleTurnKey,
  sortInitiativeTrackerRows,
  trackerStatusFieldsFromCharacter,
  filterRowsForPlayerView,
  type InitiativeTrackerRowStatus,
} from "@/components/initiativeTracker/utils";
import CharacterService from "@/services/CharacterService";
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
import { useUser } from "@/hooks/useUser";
import {
  endBattle,
  nextBattleTurn,
  previousBattleTurn,
  selectActiveTurnRowId,
  selectBattleStarted,
  selectCharacterSheetRemoteVersions,
  selectCurrentRound,
  selectTurnsWithActions,
  selectInitiativeTrackerRows,
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  startBattle,
  updateInitiativeTrackerRow,
  removeInitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

export default function InitiativeTrackerPage() {
  const t = useTranslations("initTracker.tracker");
  const tInit = useTranslations("initTracker");
  const tBattle = useTranslations("characterDetail.battle");
  const dispatch = useAppDispatch();
  const { locale } = useParams<{ locale: string }>();
  const sessionCode = useAppSelector(selectSessionCode);
  const isInSession = useAppSelector(selectIsInSession);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useUser();
  const [healthDialogRow, setHealthDialogRow] = React.useState<InitiativeTrackerRow | null>(null);
  const rows = useAppSelector(selectInitiativeTrackerRows);
  const battleStarted = useAppSelector(selectBattleStarted);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const currentRound = useAppSelector(selectCurrentRound);
  const turnsWithActions = useAppSelector(selectTurnsWithActions);
  const remoteCharacterVersions = useAppSelector(selectCharacterSheetRemoteVersions);

  const isGameMaster = React.useMemo(() => {
    const userId = user.user?.keycloakId;
    if (!userId) return true;
    return participants.some((p) => p.userId === userId && p.status === "gameMaster");
  }, [participants, user.user?.keycloakId]);

  const trackerMode = isGameMaster ? "gm" : "player";

  const visibleRows = React.useMemo(() => {
    const sorted = sortInitiativeTrackerRows(rows);
    return isGameMaster ? sorted : filterRowsForPlayerView(sorted);
  }, [isGameMaster, rows]);

  const activeTurnIndex = React.useMemo(() => {
    if (!activeTurnRowId) return -1;
    return visibleRows.findIndex((row) => row.id === activeTurnRowId);
  }, [activeTurnRowId, visibleRows]);

  const hasPreviousTurn = activeTurnIndex > 0 || currentRound > 1;

  const previousTurnState = React.useMemo((): PreviousTurnState => {
    if (!battleStarted || !hasPreviousTurn || !activeTurnRowId) return "noPreviousTurn";

    const currentKey = buildBattleTurnKey(currentRound, activeTurnRowId);
    if (isBattleTurnLocked(currentKey, turnsWithActions)) return "currentTurnLocked";

    return canUndoBattleTurn(visibleRows, currentRound, activeTurnRowId, turnsWithActions)
      ? "available"
      : "noPreviousTurn";
  }, [activeTurnRowId, battleStarted, currentRound, hasPreviousTurn, visibleRows, turnsWithActions]);

  const canGoPrevious = previousTurnState === "available";

  const updateRow = (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => {
    dispatch(updateInitiativeTrackerRow({ id, changes }));
  };

  const lastSyncedVersionsRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (!isGameMaster) return;

    const candidates = rows.filter((row) => row.kind === "player" && row.hitPoints <= 0);
    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;
    const refreshes: Promise<void>[] = [];

    const rowIdsByCharacterId = new Map<string, string[]>();
    for (const row of candidates) {
      const list = rowIdsByCharacterId.get(row.characterId) ?? [];
      list.push(row.id);
      rowIdsByCharacterId.set(row.characterId, list);
    }

    rowIdsByCharacterId.forEach((rowIds, characterId) => {
      const remoteVersion = remoteCharacterVersions[characterId] ?? 0;
      const lastSeen = lastSyncedVersionsRef.current.get(characterId) ?? 0;
      if (remoteVersion <= lastSeen) return;
      lastSyncedVersionsRef.current.set(characterId, remoteVersion);

      refreshes.push(
        CharacterService.getCharacterById(characterId, { sessionCode })
          .then((character) => {
            if (cancelled) return;
            const fields = trackerStatusFieldsFromCharacter(character);
            rowIds.forEach((rowId) => {
              dispatch(updateInitiativeTrackerRow({ id: rowId, changes: fields }));
            });
          })
          .catch(() => {
            lastSyncedVersionsRef.current.set(characterId, lastSeen);
          }),
      );
    });

    void Promise.allSettled(refreshes);

    return () => {
      cancelled = true;
    };
  }, [dispatch, isGameMaster, remoteCharacterVersions, rows, sessionCode]);

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

  const ownCharacterId = React.useMemo(() => {
    const userId = user.user?.keycloakId;
    if (!userId) return null;
    return participants.find((p) => p.userId === userId)?.characterId ?? null;
  }, [participants, user.user?.keycloakId]);

  const ownCharacterSheetHref = React.useMemo(() => {
    if (!ownCharacterId) return null;
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(ownCharacterId)}${query}`;
  }, [locale, ownCharacterId, sessionCode]);

  const getRowLabels = (row: InitiativeTrackerRow) => {
    const name = characterName(row.firstname, row.lastname, row.surname);

    return {
      initiativeFor: t("initiativeFor", { name }),
      viewSheetFor: t("viewSheetFor", { name }),
      viewSheet: t("viewSheet"),
      viewOwnSheet: t("viewOwnSheet"),
      onlyOwnCharacterSheet: t("onlyOwnCharacterSheet"),
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
      playerDisplayNameSubtitle: t("playerDisplayNameSubtitle"),
      hiddenField: t("hiddenField"),
      otherGroup: t("otherGroup"),
      expandDetails: t("expandDetails", { name }),
      collapseDetails: t("collapseDetails", { name }),
      detailsFor: t("detailsFor", { name }),
      activeTurn: t("activeTurn"),
      visibilityDialog: {
        title: t("visibilityDialog.title"),
        showToPlayers: t("visibilityDialog.showToPlayers"),
        playerDisplayName: t("visibilityDialog.playerDisplayName"),
        playerDisplayNameHint: t("visibilityDialog.playerDisplayNameHint"),
        playerDisplayNamePlaceholder: t("visibilityDialog.playerDisplayNamePlaceholder"),
        configureFor: t("visibilityDialog.configureFor", { name }),
        apply: t("visibilityDialog.apply"),
        cancel: t("visibilityDialog.cancel"),
        leaveInitiative: t("visibilityDialog.leaveInitiative"),
        playerRowVisibilityHint: t("visibilityDialog.playerRowVisibilityHint"),
        fields: {
          initiative: t("visibilityDialog.fields.initiative"),
          name: t("visibilityDialog.fields.name"),
          hitPoints: t("visibilityDialog.fields.hitPoints"),
          armorClass: t("visibilityDialog.fields.armorClass"),
          conditions: t("visibilityDialog.fields.conditions"),
          groupLabel: t("visibilityDialog.fields.groupLabel"),
        },
      },
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
      getStatusLabel: (status: InitiativeTrackerRowStatus) => t(`statusLabels.${status}`, { name }),
    };
  };

  if (visibleRows.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-[30px] bg-card/90 px-6 py-5 text-center shadow-xl">
          <h1 className="text-xl font-bold text-white">{t("emptyTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">
            {isGameMaster ? t("emptyDescription") : t("playerEmptyDescription")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3">
        {!isGameMaster ? (
          <p
            className="text-center text-sm text-white/60"
            role="status">
            {t("playerReadOnlyNotice")}
          </p>
        ) : null}

        {(battleStarted || isGameMaster) ? (
          <div className="flex min-w-0 items-center justify-between gap-2">
            {battleStarted ? (
              <div className="min-w-0 rounded-full bg-card px-4 py-2 text-sm font-bold text-white shadow-lg sm:px-5 sm:text-base">
                <span className="block truncate">{t("roundIndicator", { round: currentRound })}</span>
              </div>
            ) : (
              <span aria-hidden="true" />
            )}

            {isGameMaster ? (
              <AddCombatantsDialog>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={tInit("addCombatants")}
                  className="gap-2 rounded-[15px] px-3 sm:px-4">
                  <UserPlus
                    className="size-4"
                    aria-hidden="true"
                  />
                  <span className="sr-only sm:not-sr-only">{tInit("addCombatants")}</span>
                </Button>
              </AddCombatantsDialog>
            ) : null}
          </div>
        ) : null}

        <InitiativeTrackerTable
          rows={visibleRows}
          mode={trackerMode}
          ownCharacterId={ownCharacterId}
          ownCharacterSheetHref={ownCharacterSheetHref}
          activeTurnRowId={battleStarted ? activeTurnRowId : null}
          initiativeLocked={battleStarted || !isGameMaster}
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
          onUpdateRow={isGameMaster ? updateRow : undefined}
          onAddCondition={isGameMaster ? addCondition : undefined}
          onRemoveCondition={isGameMaster ? removeCondition : undefined}
          onClearConditions={isGameMaster ? clearConditions : undefined}
          onHitPointsClick={isGameMaster && isInSession ? (row) => setHealthDialogRow(row) : undefined}
          onRemoveFromInitiative={
            isGameMaster ? (rowId) => dispatch(removeInitiativeTrackerRow(rowId)) : undefined
          }
          getRowLabels={getRowLabels}
          groupedInitiativeLabels={
            isGameMaster
              ? {
                  enableMode: t("groupedInitiativeEnable"),
                  disableMode: t("groupedInitiativeDisable"),
                  getSelectedCountLabel: (count) => t("groupedInitiativeSelectedCount", { count }),
                  initiativePlaceholder: t("groupedInitiativePlaceholder"),
                  apply: t("groupedInitiativeApply"),
                  clearSelection: t("groupedInitiativeClearSelection"),
                  selectAllRows: t("selectAllRows"),
                }
              : undefined
          }
          turnControls={
            isGameMaster ? (
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
                }}
                onStartCombat={() => dispatch(startBattle())}
                onEndCombat={() => dispatch(endBattle())}
                onPrevious={() => dispatch(previousBattleTurn())}
                onNext={() => dispatch(nextBattleTurn())}
              />
            ) : null
          }
        />

        {isGameMaster && isInSession ? (
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
