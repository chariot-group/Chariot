"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayersPlus } from "lucide-react";
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
  trackerMirrorFieldsFromCharacter,
  filterRowsForPlayerView,
  type InitiativeTrackerRowStatus,
} from "@/components/initiativeTracker/utils";
import CharacterService from "@/services/CharacterService";
import {
  buildConditionEntry,
  formatRemainingConditionDuration,
} from "@/components/initiativeTracker/conditionDuration";
import { ROUND_DURATION_SECONDS, SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import type {
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
} from "@/store/slices/sessionSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAppStore } from "@/store/hooks";
import { useUser } from "@/hooks/useUser";
import { emitBattleStateUpdate } from "@/lib/sessionBattleSyncBridge";
import { getPooledSessionSocket } from "@/lib/sessionSocketPool";
import {
  endBattle,
  nextBattleTurn,
  previousBattleTurn,
  selectActiveTurnRowId,
  selectBattleInitialized,
  selectBattleStarted,
  selectCharacterSheetRemoteVersions,
  selectCurrentRound,
  selectCurrentUserParticipant,
  selectLastConsultedSheetPath,
  selectBattleStateSnapshot,
  selectSessionInitBattleDraft,
  selectTurnsWithActions,
  selectInitiativeTrackerRows,
  selectIsInSession,
  selectSessionCode,
  selectSessionParticipants,
  removeInitiativeTrackerRow,
  removeInitiativeTrackerRows,
  startBattle,
  updateInitiativeTrackerRow,
  updateInitiativeTrackerRowsBulk,
} from "@/store/slices/sessionSlice";
import type { InitiativeTrackerRow } from "@/store/slices/sessionSlice";

export default function InitiativeTrackerPage() {
  const t = useTranslations("initTracker.tracker");
  const tInit = useTranslations("initTracker");
  const tBattle = useTranslations("characterDetail.battle");
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const sessionCode = useAppSelector(selectSessionCode);
  const isInSession = useAppSelector(selectIsInSession);
  const participants = useAppSelector(selectSessionParticipants);
  const user = useUser();
  const [healthDialogRow, setHealthDialogRow] = React.useState<InitiativeTrackerRow | null>(null);
  const rows = useAppSelector(selectInitiativeTrackerRows);
  const battleInitialized = useAppSelector(selectBattleInitialized);
  const battleStarted = useAppSelector(selectBattleStarted);
  const activeTurnRowId = useAppSelector(selectActiveTurnRowId);
  const currentRound = useAppSelector(selectCurrentRound);
  const turnsWithActions = useAppSelector(selectTurnsWithActions);
  const remoteCharacterVersions = useAppSelector(selectCharacterSheetRemoteVersions);
  const lastConsultedSheetPath = useAppSelector(selectLastConsultedSheetPath);
  const initBattleDraft = useAppSelector(selectSessionInitBattleDraft);

  const isGameMaster = React.useMemo(() => {
    const userId = user.user?.keycloakId;
    if (!userId) return true;
    return participants.some((p) => p.userId === userId && p.status === "gameMaster");
  }, [participants, user.user?.keycloakId]);

  const trackerMode = isGameMaster ? "gm" : "player";
  const allowPlayerInitiativeInput = initBattleDraft.allowPlayerInitiativeInput ?? false;
  const previousBattleInitializedRef = React.useRef(battleInitialized);

  const ownCharacterId = React.useMemo(() => {
    const userId = user.user?.keycloakId;
    if (!userId) return null;
    return participants.find((p) => p.userId === userId)?.characterId ?? null;
  }, [participants, user.user?.keycloakId]);
  const ownParticipant = useAppSelector((state) =>
    user.user?.keycloakId ? selectCurrentUserParticipant(state, user.user.keycloakId) : null,
  );

  const ownCharacterSheetHref = React.useMemo(() => {
    if (!ownCharacterId) return null;
    const query = sessionCode ? `?sessionCode=${encodeURIComponent(sessionCode)}` : "";
    return `/${locale}/characters/${encodeURIComponent(ownCharacterId)}${query}`;
  }, [locale, ownCharacterId, sessionCode]);

  const playerCanAccessPreparationTracker = !isGameMaster
    && battleInitialized
    && !battleStarted
    && allowPlayerInitiativeInput
    && ownCharacterId != null
    && ownParticipant?.status === "connected";
  const playerCanEditOwnInitiative = playerCanAccessPreparationTracker;

  const visibleRows = React.useMemo(() => {
    if (isGameMaster) {
      return sortInitiativeTrackerRows(rows);
    }

    if (!battleStarted) {
      return ownCharacterId ? rows.filter((row) => row.characterId === ownCharacterId) : [];
    }

    return filterRowsForPlayerView(rows);
  }, [battleStarted, isGameMaster, ownCharacterId, rows]);

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

  const broadcastCurrentBattleState = React.useCallback((options?: { includeEnded?: boolean }) => {
    if (!isGameMaster || !isInSession) return;
    const snapshot = selectBattleStateSnapshot(
      store.getState() as Parameters<typeof selectBattleStateSnapshot>[0],
    );
    if (
      !snapshot.battleStarted
      && !(snapshot.battleInitialized && snapshot.allowPlayerInitiativeInput)
      && !options?.includeEnded
    ) {
      return;
    }
    emitBattleStateUpdate(snapshot);
  }, [isGameMaster, isInSession, store]);

  const dispatchTrackerAction = React.useCallback((
    action: ReturnType<
      | typeof updateInitiativeTrackerRow
      | typeof removeInitiativeTrackerRow
      | typeof removeInitiativeTrackerRows
      | typeof updateInitiativeTrackerRowsBulk
      | typeof startBattle
      | typeof endBattle
      | typeof nextBattleTurn
      | typeof previousBattleTurn
    >,
    options?: { includeEnded?: boolean },
  ) => {
    dispatch(action);
    broadcastCurrentBattleState(options);
  }, [broadcastCurrentBattleState, dispatch]);

  const updateRow = (id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => {
    dispatchTrackerAction(updateInitiativeTrackerRow({ id, changes }));
  };

  const lastSyncedVersionsRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (!isGameMaster) return;

    const rowIdsByCharacterId = new Map<string, string[]>();
    for (const row of rows) {
      const list = rowIdsByCharacterId.get(row.characterId) ?? [];
      list.push(row.id);
      rowIdsByCharacterId.set(row.characterId, list);
    }

    if (rowIdsByCharacterId.size === 0) {
      return;
    }

    let cancelled = false;
    const refreshes: Promise<void>[] = [];

    rowIdsByCharacterId.forEach((rowIds, characterId) => {
      const remoteVersion = remoteCharacterVersions[characterId] ?? 0;
      const lastSeen = lastSyncedVersionsRef.current.get(characterId) ?? 0;
      if (remoteVersion <= lastSeen) return;
      lastSyncedVersionsRef.current.set(characterId, remoteVersion);

      refreshes.push(
        CharacterService.getCharacterById(characterId, { sessionCode })
          .then((character) => {
            if (cancelled) return;
            const fields = trackerMirrorFieldsFromCharacter(character);
            rowIds.forEach((rowId) => {
              dispatchTrackerAction(updateInitiativeTrackerRow({ id: rowId, changes: fields }));
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
  }, [dispatchTrackerAction, isGameMaster, remoteCharacterVersions, rows, sessionCode]);

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

  React.useEffect(() => {
    if (!isGameMaster && !battleStarted && !playerCanAccessPreparationTracker) {
      if (ownCharacterSheetHref) {
        router.replace(ownCharacterSheetHref);
      }
      return;
    }

    const hadBattle = previousBattleInitializedRef.current;
    previousBattleInitializedRef.current = battleInitialized;

    if (battleInitialized || !hadBattle) {
      return;
    }

    if (isGameMaster) {
      if (lastConsultedSheetPath) {
        router.replace(lastConsultedSheetPath);
      }
      return;
    }

    if (ownCharacterSheetHref) {
      router.replace(ownCharacterSheetHref);
    }
  }, [
    battleInitialized,
    battleStarted,
    isGameMaster,
    lastConsultedSheetPath,
    ownCharacterSheetHref,
    playerCanAccessPreparationTracker,
    router,
  ]);

  React.useEffect(() => {
    if (!isGameMaster || battleStarted || !battleInitialized || !allowPlayerInitiativeInput) return;

    const socket = getPooledSessionSocket();
    if (!socket) return;

    const onPlayerInitiativeSubmitted = ({
      characterId,
      initiative,
      userId,
    }: {
      characterId?: string;
      initiative?: number;
      userId?: string;
    }) => {
      if (typeof characterId !== "string" || !characterId.trim()) return;
      if (!Number.isFinite(initiative)) return;
      if (typeof userId !== "string" || !userId.trim()) return;

      const participant = participants.find((p) => p.userId === userId);
      if (!participant || participant.status === "gameMaster" || participant.characterId !== characterId) {
        return;
      }

      const row = rows.find((candidate) => candidate.characterId === characterId);
      if (!row || row.groupId !== SESSION_PARTICIPANTS_GROUP_ID) return;

      dispatchTrackerAction(
        updateInitiativeTrackerRow({
          id: row.id,
          changes: { initiative: Math.trunc(Number(initiative)) },
        }),
      );
    };

    socket.on("session:player-initiative-submitted", onPlayerInitiativeSubmitted);

    return () => {
      socket.off("session:player-initiative-submitted", onPlayerInitiativeSubmitted);
    };
  }, [
    allowPlayerInitiativeInput,
    battleInitialized,
    battleStarted,
    dispatchTrackerAction,
    isGameMaster,
    participants,
    rows,
  ]);

  const playerUpdateRow = React.useCallback((id: string, changes: Partial<Omit<InitiativeTrackerRow, "id">>) => {
    if (!playerCanEditOwnInitiative || !ownCharacterId) return;

    const row = rows.find((candidate) => candidate.id === id);
    if (!row || row.characterId !== ownCharacterId) return;

    const nextInitiative = changes.initiative;
    if (!Number.isFinite(nextInitiative)) return;
    const normalizedInitiative = Math.trunc(Number(nextInitiative));

    dispatch(updateInitiativeTrackerRow({
      id,
      changes: { initiative: normalizedInitiative },
    }));

    const socket = getPooledSessionSocket();
    const userId = user.user?.keycloakId;
    if (!socket || !sessionCode || !userId) return;

    socket.emit("session:player-initiative-submitted", {
      sessionId: sessionCode,
      characterId: ownCharacterId,
      initiative: normalizedInitiative,
    });
  }, [dispatch, ownCharacterId, playerCanEditOwnInitiative, rows, sessionCode, user.user?.keycloakId]);

  if (!isGameMaster && !battleStarted && !playerCanAccessPreparationTracker) {
    return null;
  }

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
      ownCharacterBadge: t("ownCharacterBadge"),
      ownCharacterLabel: t("ownCharacterLabel", { name }),
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
          lifeStatus: t("visibilityDialog.fields.lifeStatus"),
          armorClass: t("visibilityDialog.fields.armorClass"),
          conditions: t("visibilityDialog.fields.conditions"),
          groupLabel: t("visibilityDialog.fields.groupLabel"),
        },
      },
      selectRowFor: t("selectRowFor", { name }),
      selectRowForVisibility: t("selectRowForVisibility", { name }),
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
            {playerCanEditOwnInitiative ? t("playerPrepInitiativeNotice") : t("playerReadOnlyNotice")}
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
                  <LayersPlus
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
          sessionCode={sessionCode}
          activeTurnRowId={battleStarted ? activeTurnRowId : null}
          initiativeLocked={battleStarted || (!isGameMaster && !playerCanEditOwnInitiative)}
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
          onUpdateRow={isGameMaster ? updateRow : playerCanEditOwnInitiative ? playerUpdateRow : undefined}
          onAddCondition={isGameMaster ? addCondition : undefined}
          onRemoveCondition={isGameMaster ? removeCondition : undefined}
          onClearConditions={isGameMaster ? clearConditions : undefined}
          onHitPointsClick={isGameMaster && isInSession ? (row) => setHealthDialogRow(row) : undefined}
          onRemoveFromInitiative={
            isGameMaster ? (rowId) => dispatchTrackerAction(removeInitiativeTrackerRow(rowId)) : undefined
          }
          onRemoveMultipleFromInitiative={
            isGameMaster ? (rowIds) => dispatchTrackerAction(removeInitiativeTrackerRows(rowIds)) : undefined
          }
          onUpdateMultipleRows={
            isGameMaster
              ? (rowIds, changes, playerDisplayName) =>
                  dispatchTrackerAction(updateInitiativeTrackerRowsBulk({ ids: rowIds, changes, playerDisplayName }))
              : undefined
          }
          getRowLabels={getRowLabels}
          groupedInitiativeLabels={
            isGameMaster && !battleStarted
              ? {
                  enableMode: t("groupedInitiativeEnable"),
                  disableMode: t("groupedInitiativeDisable"),
                  enableModeShort: t("groupedInitiativeEnableShort"),
                  disableModeShort: t("groupedInitiativeDisableShort"),
                  getSelectedCountLabel: (count) => t("groupedInitiativeSelectedCount", { count }),
                  initiativePlaceholder: t("groupedInitiativePlaceholder"),
                  apply: t("groupedInitiativeApply"),
                  clearSelection: t("groupedInitiativeClearSelection"),
                  clearSelectionShort: t("groupedInitiativeClearSelectionShort"),
                  selectAllRows: t("selectAllRows"),
                  selectAllRowsShort: t("selectAllRowsShort"),
                }
              : undefined
          }
          bulkVisibilityLabels={
            isGameMaster
              ? {
                  enableMode: t("bulkVisibilityEnable"),
                  disableMode: t("bulkVisibilityDisable"),
                  enableModeShort: t("bulkVisibilityEnableShort"),
                  disableModeShort: t("bulkVisibilityDisableShort"),
                  modeTitle: t("bulkVisibilityModeTitle"),
                  getSelectedCountLabel: (count) => t("groupedInitiativeSelectedCount", { count }),
                  selectAllRows: t("bulkVisibilitySelectAllRows"),
                  selectAllRowsShort: t("bulkVisibilitySelectAllRowsShort"),
                  clearSelection: t("groupedInitiativeClearSelection"),
                  clearSelectionShort: t("groupedInitiativeClearSelectionShort"),
                  title: t("bulkVisibilityDialog.title"),
                  description: t("bulkVisibilityDialog.description"),
                  showToPlayers: t("visibilityDialog.showToPlayers"),
                  playerDisplayName: t("bulkVisibilityDialog.playerDisplayName"),
                  playerDisplayNameHint: t("bulkVisibilityDialog.playerDisplayNameHint"),
                  playerDisplayNamePlaceholder: t("bulkVisibilityDialog.playerDisplayNamePlaceholder"),
                  fieldsTitle: t("visibilityDialog.title"),
                  emptySelection: t("bulkVisibilityDialog.emptySelection"),
                  configure: t("bulkVisibilityDialog.configure"),
                  configureShort: t("bulkVisibilityDialog.configureShort"),
                  cancel: t("visibilityDialog.cancel"),
                  leaveInitiative: t("bulkVisibilityDialog.leaveInitiative"),
                  fields: {
                    initiative: t("visibilityDialog.fields.initiative"),
                    name: t("visibilityDialog.fields.name"),
                    hitPoints: t("visibilityDialog.fields.hitPoints"),
                    lifeStatus: t("visibilityDialog.fields.lifeStatus"),
                    armorClass: t("visibilityDialog.fields.armorClass"),
                    conditions: t("visibilityDialog.fields.conditions"),
                    groupLabel: t("visibilityDialog.fields.groupLabel"),
                  },
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
                  endCombatConfirmTitle: t("endCombatConfirmTitle"),
                  endCombatConfirmDescription: t("endCombatConfirmDescription"),
                  endCombatConfirmAction: t("endCombatConfirmAction"),
                  endCombatCancelAction: t("endCombatCancelAction"),
                  previous: t("previousTurn"),
                  next: t("nextTurn"),
                  previousHintAvailable: t("previousTurnHintAvailable"),
                  previousHintLocked: t("previousTurnHintLocked"),
                  previousHintNoPrevious: t("previousTurnHintNoPrevious"),
                }}
                onStartCombat={() => dispatchTrackerAction(startBattle())}
                onEndCombat={() => dispatchTrackerAction(endBattle(), { includeEnded: true })}
                onPrevious={() => dispatchTrackerAction(previousBattleTurn())}
                onNext={() => dispatchTrackerAction(nextBattleTurn())}
              />
            ) : null
          }
          newlyCombatantRevealedLabel={!isGameMaster ? t("newlyCombatantRevealed") : undefined}
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
