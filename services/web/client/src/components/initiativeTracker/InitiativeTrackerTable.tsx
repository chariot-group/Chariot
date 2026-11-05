"use client";

import * as React from "react";
import { Cog, ListOrdered, LogOut, X } from "lucide-react";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { deriveBulkVisibilitySummary } from "@/components/initiativeTracker/bulkSelection";
import { InitiativeTrackerBulkVisibilityDialog } from "@/components/initiativeTracker/InitiativeTrackerBulkVisibilityDialog";
import { InitiativeTrackerGroupedInitiativeBar } from "@/components/initiativeTracker/InitiativeTrackerGroupedInitiativeBar";
import { InitiativeTrackerRow as InitiativeTrackerRowComponent } from "@/components/initiativeTracker/InitiativeTrackerRow";
import {
  PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_GRID_TEMPLATE_COLUMNS,
  TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION,
  TRACKER_HEADER_ALIGN,
} from "@/components/initiativeTracker/constants";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import type { ConditionSelectCustomEffectsProps } from "@/components/initiativeTracker/ConditionSelect";
import {
  characterName,
  initiativeTotalFromRoll,
  isInitiativeMissing,
  resolveInitiativeModifier,
  type InitiativeTrackerRowStatus,
} from "@/components/initiativeTracker/utils";
import { useNewlyRevealedRows } from "@/hooks/useNewlyRevealedRows";
import { useStatusChangedRows } from "@/hooks/useStatusChangedRows";
import { useMediaAvatarBatch } from "@/hooks/useMediaAvatar";

export type InitiativeTrackerTableProps = {
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
  customEffects?: ConditionSelectCustomEffectsProps;
  onHitPointsClick?: (row: InitiativeTrackerRow) => void;
  battleStarted?: boolean;
  currentRound?: number;
  onSetConcentration?: (row: InitiativeTrackerRow, concentration: import("@/store/slices/sessionSlice").TrackerConcentration | null) => void;
  onOpenConcentrationSaveDialog?: (row: InitiativeTrackerRow) => void;
  onRemoveFromInitiative?: (rowId: string) => void;
  onRemoveMultipleFromInitiative?: (rowIds: string[]) => void;
  onUpdateMultipleRows?: (
    rowIds: string[],
    changes: Omit<Partial<Omit<InitiativeTrackerRow, "id" | "playerDisplayName">>, "playerFieldVisibility"> & {
      playerFieldVisibility?: Partial<InitiativeTrackerRow["playerFieldVisibility"]>;
    },
    playerDisplayName?: string,
  ) => void;
  getRowLabels: (row: InitiativeTrackerRow) => {
    initiativeFor: string;
    initiativeModifierFor: (bonus: string) => string;
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
        lifeStatus: string;
        armorClass: string;
        conditions: string;
        concentration: string;
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
    formatConditionEntryDuration: (
      entry: Pick<InitiativeTrackerConditionEntry, "duration" | "remainingSeconds">,
    ) => string | null;
    getConditionDurationUnits: () => {
      value: InitiativeTrackerConditionDurationUnit;
      label: string;
    }[];
    getStatusLabel: (status: InitiativeTrackerRowStatus) => string;
  };
  activeTurnRowId?: string | null;
  initiativeLocked?: boolean;
  groupedInitiativeLabels?: {
    action: string;
    getSelectedCountLabel: (count: number) => string;
    initiativePlaceholder: string;
    apply: string;
    clearSelection: string;
    clearSelectionShort: string;
    selectAllRows: string;
    selectAllRowsShort: string;
  };
  bulkVisibilityLabels?: {
    getSelectedCountLabel: (count: number) => string;
    selectAllRows: string;
    selectAllRowsShort: string;
    clearSelection: string;
    clearSelectionShort: string;
    selectionToolbar: string;
    contextMenuSelection: (count: number) => string;
    title: string;
    description: string;
    showToPlayers: string;
    playerDisplayName: string;
    playerDisplayNameHint: string;
    playerDisplayNamePlaceholder: string;
    fieldsTitle: string;
    emptySelection: string;
    configure: string;
    configureShort: string;
    cancel: string;
    leaveInitiative: string;
    fields: {
      initiative: string;
      name: string;
      hitPoints: string;
      lifeStatus: string;
      armorClass: string;
      conditions: string;
      concentration: string;
      groupLabel: string;
    };
  };
  turnControls?: React.ReactNode;
  ownCharacterId?: string | null;
  ownCharacterSheetHref?: string | null;
  sessionCode?: string | null;
  newlyCombatantRevealedLabel?: string;
  /** FR-combat-initiative-tracker — pre-combat guidance label for rows without initiative. */
  missingInitiativeLabel?: string;
};

function getCompactHeaderLabel(label: string, length: number) {
  const trimmed = label.trim();
  if (trimmed.length <= length + 1) return trimmed;
  return `${trimmed.slice(0, length)}.`;
}

export function canConfigureBulkVisibility(selectedCount: number) {
  return selectedCount > 0;
}

export function InitiativeTrackerTable({
  rows,
  mode = "gm",
  columnLabels,
  getSheetHref,
  onUpdateRow,
  onAddCondition,
  onRemoveCondition,
  onClearConditions,
  customEffects,
  onHitPointsClick,
  battleStarted = false,
  currentRound = 1,
  onSetConcentration,
  onOpenConcentrationSaveDialog,
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
  sessionCode = null,
  newlyCombatantRevealedLabel,
  missingInitiativeLabel,
}: InitiativeTrackerTableProps) {
  const isPlayerView = mode === "player";
  const [groupedInitiativeOpen, setGroupedInitiativeOpen] = React.useState(false);
  const [bulkVisibilityOpen, setBulkVisibilityOpen] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(() => new Set());
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string>>(() => new Set());

  const newlyRevealedIds = useNewlyRevealedRows(isPlayerView ? rows.map((r) => r.id) : []);
  const statusChangedRows = useStatusChangedRows(rows, !isPlayerView);

  const avatarBatchItems = React.useMemo(
    () =>
      rows.map((row) => ({
        scope: "character" as const,
        entityId: row.characterId,
        storedValue: row.avatar,
        size: "thumb" as const,
      })),
    [rows],
  );

  const { getUrl: getAvatarUrl } = useMediaAvatarBatch(
    avatarBatchItems,
    sessionCode,
    rows.length > 0,
  );

  const [liveAnnouncement, setLiveAnnouncement] = React.useState("");
  const announcedRef = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (!isPlayerView || newlyRevealedIds.size === 0) return;
    for (const id of announcedRef.current) {
      if (!newlyRevealedIds.has(id)) announcedRef.current.delete(id);
    }
    const toAnnounce = [...newlyRevealedIds].filter((id) => !announcedRef.current.has(id));
    if (toAnnounce.length === 0) return;
    toAnnounce.forEach((id) => announcedRef.current.add(id));
    const names = toAnnounce.map((id) => {
      const row = rows.find((r) => r.id === id);
      return row ? (characterName(row.firstname, row.lastname, row.surname) || row.playerDisplayName || "???") : "???";
    });
    setLiveAnnouncement(
      names.map((n) => (newlyCombatantRevealedLabel ? `${n} — ${newlyCombatantRevealedLabel}` : n)).join(". "),
    );
  }, [newlyRevealedIds, isPlayerView, rows, newlyCombatantRevealedLabel]);
  const groupedInitiativeAvailable = !isPlayerView && !initiativeLocked && groupedInitiativeLabels != null;
  // FR-tracker-bulk-actions — "select first, act next": checkboxes are always visible for the GM.
  const selectionEnabled = !isPlayerView && bulkVisibilityLabels != null;
  const groupedInitiativeActive = groupedInitiativeAvailable && groupedInitiativeOpen;
  const gridTemplateColumns = isPlayerView
    ? PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS
    : selectionEnabled
      ? TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION
      : TRACKER_GRID_TEMPLATE_COLUMNS;
  const compactInitiativeLabel = getCompactHeaderLabel(columnLabels.initiative, 4);
  const compactVisibleLabel = getCompactHeaderLabel(columnLabels.visible, 3);
  const headerLabelClassName = "block min-w-0 truncate leading-tight";

  const clearSelection = React.useCallback(() => {
    setSelectedRowIds(new Set());
    setGroupedInitiativeOpen(false);
    setBulkVisibilityOpen(false);
  }, []);

  // Drop ids of rows that left the roster so counts and actions stay accurate.
  React.useEffect(() => {
    setSelectedRowIds((current) => {
      const ids = new Set(rows.map((row) => row.id));
      const next = new Set([...current].filter((id) => ids.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

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
  const selectedRows = React.useMemo(() => rows.filter((row) => selectedRowIds.has(row.id)), [rows, selectedRowIds]);
  const bulkVisibilitySummary = React.useMemo(
    () => (selectedRows.length > 0 ? deriveBulkVisibilitySummary(selectedRows) : null),
    [selectedRows],
  );
  const selectedCount = selectedRows.length;
  const selectedCountLabel = bulkVisibilityLabels?.getSelectedCountLabel(selectedCount) ?? null;

  const toggleSelectAllRows = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedRowIds(new Set(rows.map((row) => row.id)));
      return;
    }
    setSelectedRowIds(new Set());
  };

  const applyGroupedInitiative = (roll: number) => {
    if (!onUpdateRow) return;
    selectedRowIds.forEach((rowId) => {
      const row = rows.find((item) => item.id === rowId);
      const modifier = resolveInitiativeModifier(row?.initiativeModifier);
      onUpdateRow(rowId, { initiative: initiativeTotalFromRoll(roll, modifier) });
    });
    clearSelection();
  };

  /** Right-click: act on the whole selection if the row is part of it, else on that row alone. */
  const focusContextRow = (rowId: string) => {
    if (selectedRowIds.has(rowId)) return;
    setSelectedRowIds(new Set([rowId]));
    setGroupedInitiativeOpen(false);
  };

  const leaveSelection = () => {
    onRemoveMultipleFromInitiative?.([...selectedRowIds]);
    clearSelection();
  };

  const renderSelectionActions = (compact: boolean) =>
    bulkVisibilityLabels ? (
      <div className="flex min-w-0 flex-wrap gap-2">
        {groupedInitiativeAvailable && groupedInitiativeLabels ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-pressed={groupedInitiativeActive}
            onClick={() => setGroupedInitiativeOpen((open) => !open)}
            className="gap-2">
            <ListOrdered
              className="size-4"
              aria-hidden="true"
            />
            {groupedInitiativeLabels.action}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => setBulkVisibilityOpen(true)}>
          <Cog
            className="size-4"
            aria-hidden="true"
          />
          {compact ? bulkVisibilityLabels.configureShort : bulkVisibilityLabels.configure}
        </Button>
        {onRemoveMultipleFromInitiative ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2 text-red hover:bg-red/15"
            onClick={leaveSelection}>
            <LogOut
              className="size-4"
              aria-hidden="true"
            />
            {bulkVisibilityLabels.leaveInitiative}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={clearSelection}>
          <X
            className="size-4"
            aria-hidden="true"
          />
          {compact ? bulkVisibilityLabels.clearSelectionShort : bulkVisibilityLabels.clearSelection}
        </Button>
      </div>
    ) : null;

  const renderGroupedInitiativeBar = () =>
    groupedInitiativeActive && groupedInitiativeLabels ? (
      <InitiativeTrackerGroupedInitiativeBar
        active={groupedInitiativeActive}
        canApply={selectedCount > 0}
        labels={{
          selectedCount: groupedInitiativeLabels.getSelectedCountLabel(selectedCount),
          initiativePlaceholder: groupedInitiativeLabels.initiativePlaceholder,
          apply: groupedInitiativeLabels.apply,
          clearSelection: groupedInitiativeLabels.clearSelection,
        }}
        onApply={applyGroupedInitiative}
        onClearSelection={clearSelection}
      />
    ) : null;

  return (
    <div className="w-full min-w-0">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>
      <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-[24px] bg-card text-xs font-bold text-white shadow-xl md:block lg:text-sm xl:text-base">
        <div
          className="grid w-full max-w-full min-w-0 items-center gap-x-1.5 px-2 py-2.5 lg:px-4 xl:gap-x-3 xl:px-5"
          style={{ gridTemplateColumns }}>
          {selectionEnabled ? (
            <Checkbox
              checked={allRowsSelected ? true : someRowsSelected ? "indeterminate" : false}
              aria-label={bulkVisibilityLabels?.selectAllRows ?? ""}
              onCheckedChange={toggleSelectAllRows}
              className="size-5 cursor-pointer justify-self-center"
            />
          ) : null}
          {!isPlayerView ? (
            <span
              className={`flex min-w-0 items-center justify-center gap-1 ${TRACKER_HEADER_ALIGN.visible}`}
              title={columnLabels.visible}>
              <span
                className={`${headerLabelClassName} xl:hidden`}
                aria-hidden="true">
                {compactVisibleLabel}
              </span>
              <span className={`${headerLabelClassName} hidden xl:block`}>{columnLabels.visible}</span>
            </span>
          ) : null}
          <span
            className={`min-w-0 text-center ${TRACKER_HEADER_ALIGN.initiative}`}
            title={columnLabels.initiative}>
            <span className="inline-flex min-w-0 max-w-full items-center justify-center gap-1">
              <span
                className={`${headerLabelClassName} xl:hidden`}
                aria-hidden="true">
                {compactInitiativeLabel}
              </span>
              <span className={`${headerLabelClassName} hidden xl:block`}>{columnLabels.initiative}</span>
            </span>
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.character}`}
            title={columnLabels.character}>
            {columnLabels.character}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.hitPoints}`}
            title={columnLabels.hitPoints}>
            {columnLabels.hitPoints}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.armorClass}`}
            title={columnLabels.armorClass}>
            {columnLabels.armorClass}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.condition}`}
            title={columnLabels.condition}>
            {columnLabels.condition}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.group}`}
            title={columnLabels.group}>
            {columnLabels.group}
          </span>
        </div>

        {selectionEnabled && selectedCount > 0 ? (
          <div
            className="flex w-full min-w-0 flex-col gap-2.5 border-t border-border px-5 py-2.5"
            role="toolbar"
            aria-label={bulkVisibilityLabels?.selectionToolbar}>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm text-white/80">
              <span
                className="min-w-0 truncate font-semibold"
                role="status">
                {selectedCountLabel}
              </span>
              {renderSelectionActions(false)}
            </div>
            {renderGroupedInitiativeBar()}
          </div>
        ) : null}
      </div>

      {selectionEnabled && bulkVisibilityLabels ? (
        <div className="rounded-[18px] bg-card/95 px-3 py-3 text-white shadow-lg ring-1 ring-white/10 md:hidden">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white/85">
              <Checkbox
                checked={allRowsSelected ? true : someRowsSelected ? "indeterminate" : false}
                aria-label={bulkVisibilityLabels.selectAllRows}
                onCheckedChange={toggleSelectAllRows}
                className="size-5 shrink-0 cursor-pointer"
              />
              <span className="min-w-0 truncate">{bulkVisibilityLabels.selectAllRowsShort}</span>
            </label>
            {selectedCount > 0 ? (
              <span
                className="shrink-0 text-xs font-semibold text-white/65"
                role="status">
                {selectedCountLabel}
              </span>
            ) : null}
          </div>
          {selectedCount > 0 ? (
            <div
              className="mt-3 flex min-w-0 flex-col gap-3 border-t border-border pt-3"
              role="toolbar"
              aria-label={bulkVisibilityLabels.selectionToolbar}>
              {renderSelectionActions(true)}
              {renderGroupedInitiativeBar()}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex w-full min-w-0 flex-col gap-2.5">
        {rows.map((row) => {
          const rowLabels = getRowLabels(row);
          const rowNode = (
            <InitiativeTrackerRowComponent
              key={row.id}
              row={row}
              mode={mode}
              ownCharacterId={ownCharacterId}
              ownCharacterSheetHref={ownCharacterSheetHref}
              avatarImageUrl={getAvatarUrl("character", row.characterId, "thumb")}
              sessionCode={sessionCode}
              isActiveTurn={activeTurnRowId != null && row.id === activeTurnRowId}
              isNewlyRevealed={isPlayerView && newlyRevealedIds.has(row.id)}
              statusChangeAnimation={statusChangedRows.get(row.id) ?? null}
              initiativeLocked={initiativeLocked}
              selectionEnabled={selectionEnabled}
              isSelected={selectedRowIds.has(row.id)}
              onSelectionChange={(selected) => toggleRowSelection(row.id, selected)}
              selectRowLabel={selectionEnabled ? rowLabels.selectRowFor : undefined}
              initiativeMissing={!isPlayerView && !initiativeLocked && missingInitiativeLabel != null && isInitiativeMissing(row)}
              initiativeMissingLabel={missingInitiativeLabel}
              isExpanded={expandedRowIds.has(row.id)}
              onToggleExpanded={() => toggleRowExpanded(row.id)}
              gridTemplateColumns={gridTemplateColumns}
              getSheetHref={isPlayerView ? undefined : getSheetHref}
              onUpdateRow={onUpdateRow}
              onAddCondition={isPlayerView ? undefined : onAddCondition}
              onRemoveCondition={isPlayerView ? undefined : onRemoveCondition}
              onClearConditions={isPlayerView ? undefined : onClearConditions}
              customEffects={isPlayerView ? undefined : customEffects}
              onHitPointsClick={isPlayerView ? undefined : onHitPointsClick}
              battleStarted={battleStarted}
              currentRound={currentRound}
              onSetConcentration={onSetConcentration}
              onOpenConcentrationSaveDialog={onOpenConcentrationSaveDialog}
              onRemoveFromInitiative={isPlayerView ? undefined : onRemoveFromInitiative}
              labels={rowLabels}
            />
          );
          if (!selectionEnabled || !bulkVisibilityLabels) return rowNode;
          const menuTargetCount = selectedRowIds.has(row.id) ? selectedCount : 1;
          const menuTitle =
            menuTargetCount > 1
              ? bulkVisibilityLabels.contextMenuSelection(menuTargetCount)
              : characterName(row.firstname, row.lastname, row.surname) || row.playerDisplayName;
          return (
            <ContextMenu
              key={row.id}
              onOpenChange={(open) => {
                if (open) focusContextRow(row.id);
              }}>
              <ContextMenuTrigger asChild>
                <div className="min-w-0">{rowNode}</div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel className="max-w-64 truncate">{menuTitle}</ContextMenuLabel>
                <ContextMenuSeparator />
                {groupedInitiativeAvailable && groupedInitiativeLabels ? (
                  <ContextMenuItem onSelect={() => setGroupedInitiativeOpen(true)}>
                    <ListOrdered aria-hidden="true" />
                    {groupedInitiativeLabels.action}
                  </ContextMenuItem>
                ) : null}
                <ContextMenuItem onSelect={() => setBulkVisibilityOpen(true)}>
                  <Cog aria-hidden="true" />
                  {bulkVisibilityLabels.configure}
                </ContextMenuItem>
                {onRemoveMultipleFromInitiative ? (
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={leaveSelection}>
                    <LogOut aria-hidden="true" />
                    {bulkVisibilityLabels.leaveInitiative}
                  </ContextMenuItem>
                ) : null}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {bulkVisibilityLabels ? (
        <InitiativeTrackerBulkVisibilityDialog
          open={bulkVisibilityOpen}
          selectedCount={selectedCount}
          selectionSummary={bulkVisibilitySummary}
          labels={{
            title: bulkVisibilityLabels.title,
            description: bulkVisibilityLabels.description,
            showToPlayers: bulkVisibilityLabels.showToPlayers,
            playerDisplayName: bulkVisibilityLabels.playerDisplayName,
            playerDisplayNameHint: bulkVisibilityLabels.playerDisplayNameHint,
            playerDisplayNamePlaceholder: bulkVisibilityLabels.playerDisplayNamePlaceholder,
            fieldsTitle: bulkVisibilityLabels.fieldsTitle,
            emptySelection: bulkVisibilityLabels.emptySelection,
            configure: bulkVisibilityLabels.configure,
            cancel: bulkVisibilityLabels.cancel,
            leaveInitiative: bulkVisibilityLabels.leaveInitiative,
            fields: bulkVisibilityLabels.fields,
          }}
          onOpenChange={setBulkVisibilityOpen}
          onLeaveInitiative={() => {
            leaveSelection();
          }}
          onApply={(changes, playerDisplayName) => {
            onUpdateMultipleRows?.([...selectedRowIds], changes, playerDisplayName);
            clearSelection();
          }}
        />
      ) : null}

      {turnControls}
    </div>
  );
}
