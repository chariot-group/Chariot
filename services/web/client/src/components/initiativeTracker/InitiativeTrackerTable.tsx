"use client";

import * as React from "react";
import { Cog, ListOrdered } from "lucide-react";
import type {
  InitiativeTrackerConditionDuration,
  InitiativeTrackerConditionDurationUnit,
  InitiativeTrackerConditionEntry,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { characterName, type InitiativeTrackerRowStatus } from "@/components/initiativeTracker/utils";
import { useNewlyRevealedRows } from "@/hooks/useNewlyRevealedRows";
import { useStatusChangedRows } from "@/hooks/useStatusChangedRows";

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
  onHitPointsClick?: (row: InitiativeTrackerRow) => void;
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
    formatConditionEntryDuration: (entry: InitiativeTrackerConditionEntry) => string | null;
    getConditionDurationUnits: () => { value: InitiativeTrackerConditionDurationUnit; label: string }[];
    getStatusLabel: (status: InitiativeTrackerRowStatus) => string;
  };
  activeTurnRowId?: string | null;
  initiativeLocked?: boolean;
  groupedInitiativeLabels?: {
    enableMode: string;
    disableMode: string;
    enableModeShort: string;
    disableModeShort: string;
    getSelectedCountLabel: (count: number) => string;
    initiativePlaceholder: string;
    apply: string;
    clearSelection: string;
    clearSelectionShort: string;
    selectAllRows: string;
    selectAllRowsShort: string;
  };
  bulkVisibilityLabels?: {
    enableMode: string;
    disableMode: string;
    enableModeShort: string;
    disableModeShort: string;
    modeTitle: string;
    getSelectedCountLabel: (count: number) => string;
    selectAllRows: string;
    selectAllRowsShort: string;
    clearSelection: string;
    clearSelectionShort: string;
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
      groupLabel: string;
    };
  };
  turnControls?: React.ReactNode;
  ownCharacterId?: string | null;
  ownCharacterSheetHref?: string | null;
  newlyCombatantRevealedLabel?: string;
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
  onHitPointsClick,
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
  newlyCombatantRevealedLabel,
}: InitiativeTrackerTableProps) {
  const isPlayerView = mode === "player";
  const [selectionMode, setSelectionMode] = React.useState<"initiative" | "visibility" | null>(null);
  const [bulkVisibilityOpen, setBulkVisibilityOpen] = React.useState(false);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(() => new Set());
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string>>(() => new Set());

  const newlyRevealedIds = useNewlyRevealedRows(isPlayerView ? rows.map((r) => r.id) : []);
  const statusChangedRows = useStatusChangedRows(rows, !isPlayerView);

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
  const bulkVisibilityAvailable = !isPlayerView && bulkVisibilityLabels != null;
  const selectionEnabled = selectionMode != null;
  const groupedInitiativeActive = selectionMode === "initiative";
  const bulkVisibilityActive = selectionMode === "visibility";
  const gridTemplateColumns = isPlayerView
    ? PLAYER_TRACKER_GRID_TEMPLATE_COLUMNS
    : selectionEnabled
      ? TRACKER_GRID_TEMPLATE_COLUMNS_WITH_SELECTION
      : TRACKER_GRID_TEMPLATE_COLUMNS;
  const compactInitiativeLabel = getCompactHeaderLabel(columnLabels.initiative, 4);
  const compactVisibleLabel = getCompactHeaderLabel(columnLabels.visible, 3);
  const headerLabelClassName = "block min-w-0 truncate leading-tight";

  const exitGroupedInitiativeMode = React.useCallback(() => {
    setSelectionMode(null);
    setSelectedRowIds(new Set());
  }, []);

  const exitBulkVisibilityMode = React.useCallback(() => {
    setSelectionMode(null);
    setSelectedRowIds(new Set());
    setBulkVisibilityOpen(false);
  }, []);

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
  const selectAllRowsLabel = bulkVisibilityActive
    ? bulkVisibilityLabels?.selectAllRows
    : groupedInitiativeLabels?.selectAllRows;
  const selectAllRowsVisibleLabel = bulkVisibilityActive
    ? bulkVisibilityLabels?.selectAllRowsShort
    : groupedInitiativeLabels?.selectAllRowsShort;
  const selectedCountLabel = bulkVisibilityActive
    ? bulkVisibilityLabels?.getSelectedCountLabel(selectedRowIds.size)
    : groupedInitiativeActive
      ? groupedInitiativeLabels?.getSelectedCountLabel(selectedRowIds.size)
      : null;
  const bulkVisibilityConfigureEnabled = canConfigureBulkVisibility(selectedRowIds.size);

  const toggleSelectAllRows = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedRowIds(new Set(rows.map((row) => row.id)));
      return;
    }
    setSelectedRowIds(new Set());
  };

  const applyGroupedInitiative = (initiative: number) => {
    if (!onUpdateRow) return;
    selectedRowIds.forEach((rowId) => {
      onUpdateRow(rowId, { initiative });
    });
    exitGroupedInitiativeMode();
  };

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
              aria-label={selectAllRowsLabel ?? ""}
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
              {bulkVisibilityAvailable && bulkVisibilityLabels ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-pressed={bulkVisibilityActive}
                      aria-label={
                        bulkVisibilityActive ? bulkVisibilityLabels.disableMode : bulkVisibilityLabels.enableMode
                      }
                      onClick={() => {
                        if (bulkVisibilityActive) {
                          exitBulkVisibilityMode();
                          return;
                        }
                        setSelectionMode("visibility");
                        setSelectedRowIds(new Set());
                      }}
                      className="size-7 shrink-0 text-white/45 hover:bg-white/10 hover:text-white/80">
                      <Cog
                        className="size-4"
                        aria-hidden="true"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {bulkVisibilityActive ? bulkVisibilityLabels.disableMode : bulkVisibilityLabels.enableMode}
                  </TooltipContent>
                </Tooltip>
              ) : null}
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
              {groupedInitiativeAvailable && groupedInitiativeLabels ? (
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
                        setSelectionMode("initiative");
                        setSelectedRowIds(new Set());
                      }}
                      className="size-7 shrink-0 text-white/45 hover:bg-white/10 hover:text-white/80 data-[state=on]:bg-white/10">
                      <ListOrdered
                        className="size-4"
                        aria-hidden="true"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {groupedInitiativeActive ? groupedInitiativeLabels.disableMode : groupedInitiativeLabels.enableMode}
                  </TooltipContent>
                </Tooltip>
              ) : null}
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

        {groupedInitiativeActive && groupedInitiativeLabels ? (
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

        {bulkVisibilityActive && bulkVisibilityLabels ? (
          <div className="w-full border-t border-white/10 px-5 py-2.5">
            <div
              className="flex min-w-0 flex-col gap-2 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between"
              role="status">
              <span className="min-w-0 truncate font-semibold">
                {bulkVisibilityLabels.getSelectedCountLabel(selectedRowIds.size)}
              </span>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={selectedRowIds.size === 0}
                  onClick={() => setSelectedRowIds(new Set())}>
                  {bulkVisibilityLabels.clearSelection}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={!bulkVisibilityConfigureEnabled}
                  onClick={() => setBulkVisibilityOpen(true)}>
                  <Cog
                    className="size-4"
                    aria-hidden="true"
                  />
                  {bulkVisibilityLabels.configure}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!isPlayerView && (groupedInitiativeAvailable || bulkVisibilityAvailable) ? (
        <div className="rounded-[18px] bg-card/95 px-3 py-3 text-white shadow-lg ring-1 ring-white/10 md:hidden">
          <div className="flex min-w-0 flex-wrap gap-2">
            {groupedInitiativeAvailable && groupedInitiativeLabels ? (
              <Button
                type="button"
                variant={groupedInitiativeActive ? "default" : "outline"}
                size="sm"
                aria-pressed={groupedInitiativeActive}
                aria-label={
                  groupedInitiativeActive ? groupedInitiativeLabels.disableMode : groupedInitiativeLabels.enableMode
                }
                onClick={() => {
                  if (groupedInitiativeActive) {
                    exitGroupedInitiativeMode();
                    return;
                  }
                  setSelectionMode("initiative");
                  setSelectedRowIds(new Set());
                }}
                className="min-w-0 flex-1 rounded-[15px] px-3">
                <ListOrdered
                  className="size-4"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">
                  {groupedInitiativeActive
                    ? groupedInitiativeLabels.disableModeShort
                    : groupedInitiativeLabels.enableModeShort}
                </span>
              </Button>
            ) : null}

            {bulkVisibilityAvailable && bulkVisibilityLabels ? (
              <Button
                type="button"
                variant={bulkVisibilityActive ? "default" : "outline"}
                size="sm"
                aria-pressed={bulkVisibilityActive}
                aria-label={bulkVisibilityActive ? bulkVisibilityLabels.disableMode : bulkVisibilityLabels.enableMode}
                onClick={() => {
                  if (bulkVisibilityActive) {
                    exitBulkVisibilityMode();
                    return;
                  }
                  setSelectionMode("visibility");
                  setSelectedRowIds(new Set());
                }}
                className="min-w-0 flex-1 rounded-[15px] px-3">
                <Cog
                  className="size-4"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">
                  {bulkVisibilityActive ? bulkVisibilityLabels.disableModeShort : bulkVisibilityLabels.enableModeShort}
                </span>
              </Button>
            ) : null}
          </div>

          {selectionEnabled ? (
            <div
              className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-white/10 pt-3"
              role="status">
              <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white/85">
                <Checkbox
                  checked={allRowsSelected ? true : someRowsSelected ? "indeterminate" : false}
                  aria-label={selectAllRowsLabel ?? ""}
                  onCheckedChange={toggleSelectAllRows}
                  className="size-5 shrink-0 cursor-pointer"
                />
                <span className="min-w-0 truncate">{selectAllRowsVisibleLabel}</span>
              </label>
              {selectedCountLabel ? (
                <span className="shrink-0 text-xs font-semibold text-white/65">{selectedCountLabel}</span>
              ) : null}
            </div>
          ) : null}

          {groupedInitiativeActive && groupedInitiativeLabels ? (
            <div className="mt-3 border-t border-white/10 pt-3">
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

          {bulkVisibilityActive && bulkVisibilityLabels ? (
            <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedRowIds.size === 0}
                onClick={() => setSelectedRowIds(new Set())}>
                {bulkVisibilityLabels.clearSelectionShort}
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={!bulkVisibilityConfigureEnabled}
                onClick={() => setBulkVisibilityOpen(true)}>
                <Cog
                  className="size-4"
                  aria-hidden="true"
                />
                {bulkVisibilityLabels.configureShort}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex w-full min-w-0 flex-col gap-2.5">
        {rows.map((row) => (
          <InitiativeTrackerRowComponent
            key={row.id}
            row={row}
            mode={mode}
            ownCharacterId={ownCharacterId}
            ownCharacterSheetHref={ownCharacterSheetHref}
            isActiveTurn={activeTurnRowId != null && row.id === activeTurnRowId}
            isNewlyRevealed={isPlayerView && newlyRevealedIds.has(row.id)}
            statusChangeAnimation={statusChangedRows.get(row.id) ?? null}
            initiativeLocked={initiativeLocked}
            selectionEnabled={selectionEnabled}
            isSelected={selectedRowIds.has(row.id)}
            onSelectionChange={(selected) => toggleRowSelection(row.id, selected)}
            selectRowLabel={
              selectionEnabled
                ? bulkVisibilityActive
                  ? getRowLabels(row).selectRowForVisibility
                  : getRowLabels(row).selectRowFor
                : undefined
            }
            isExpanded={expandedRowIds.has(row.id)}
            onToggleExpanded={() => toggleRowExpanded(row.id)}
            gridTemplateColumns={gridTemplateColumns}
            getSheetHref={isPlayerView ? undefined : getSheetHref}
            onUpdateRow={onUpdateRow}
            onAddCondition={isPlayerView ? undefined : onAddCondition}
            onRemoveCondition={isPlayerView ? undefined : onRemoveCondition}
            onClearConditions={isPlayerView ? undefined : onClearConditions}
            onHitPointsClick={isPlayerView ? undefined : onHitPointsClick}
            onRemoveFromInitiative={isPlayerView ? undefined : onRemoveFromInitiative}
            labels={getRowLabels(row)}
          />
        ))}
      </div>

      {bulkVisibilityLabels ? (
        <InitiativeTrackerBulkVisibilityDialog
          open={bulkVisibilityOpen}
          selectedCount={selectedRowIds.size}
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
            onRemoveMultipleFromInitiative?.([...selectedRowIds]);
            exitBulkVisibilityMode();
          }}
          onApply={(changes, playerDisplayName) => {
            onUpdateMultipleRows?.([...selectedRowIds], changes, playerDisplayName);
            exitBulkVisibilityMode();
          }}
        />
      ) : null}

      {turnControls}
    </div>
  );
}
