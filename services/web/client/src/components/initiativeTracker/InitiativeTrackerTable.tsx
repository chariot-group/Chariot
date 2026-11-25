"use client";

import * as React from "react";
import { ListOrdered, LogOut, MonitorCog, X } from "lucide-react";
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
  getTrackerGridTemplateColumns,
  TRACKER_CARD_PADDING_X_CLASS,
  TRACKER_FIT_SCREEN_CLASS,
  TRACKER_GRID_GAP_CLASS,
  TRACKER_HEADER_ALIGN,
  TRACKER_ROWS_SCROLL_CLASS,
  TRACKER_ZONE_PADDING_Y_CLASS,
} from "@/components/initiativeTracker/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ActiveInitiativeTrackerCondition } from "@/components/initiativeTracker/types";
import type { ConditionSelectCustomEffectsProps } from "@/components/initiativeTracker/ConditionSelect";
import {
  characterName,
  initiativeTotalFromRoll,
  isInitiativeMissing,
  isInitiativeInputTarget,
  orderRowsByFrozenIds,
  findAdjacentInitiativeInput,
  getVisibleInitiativeInputs,
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
    initiativeRollPlaceholder?: string;
    shortStatLabels?: { initiative: string; hitPoints: string; armorClass: string };
    initiativeTotalPreview?: string;
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
    accept: string;
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
  /** FR-combat-initiative-tracker — tracker card footer (GM turn controls, player round). */
  turnControls?: React.ReactNode;
  /** FR-combat-initiative-tracker — GM roster actions, right side of the card header toolbar. */
  headerActions?: React.ReactNode;
  /** Accessible name of the scrolling rows area (e.g. « Combattants »). */
  rowsLabel?: string;
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

/**
 * FR-tracker-bulk-actions — selected count of the header toolbar: the number alone on mobile so the
 * toolbar stays on one line, the full label from `md`; the full label is always the accessible text.
 */
export function TrackerSelectedCount({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="shrink-0 text-sm font-semibold tabular-nums text-white/85"
      role="status">
      <span
        className="md:hidden"
        aria-hidden="true">
        {count}
      </span>
      <span
        className="hidden md:inline"
        aria-hidden="true">
        {label}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
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
  headerActions,
  rowsLabel,
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

  const [frozenOrder, setFrozenOrder] = React.useState<string[] | null>(null);
  const displayRows = React.useMemo(
    () => (frozenOrder && !initiativeLocked ? orderRowsByFrozenIds(rows, frozenOrder) : rows),
    [rows, frozenOrder, initiativeLocked],
  );

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
  const gridTemplateColumns = getTrackerGridTemplateColumns({
    selection: selectionEnabled,
    visibility: !isPlayerView,
    initiativeEditable: !initiativeLocked,
  });
  const compactInitiativeLabel = getCompactHeaderLabel(columnLabels.initiative, 4);
  const compactVisibleLabel = getCompactHeaderLabel(columnLabels.visible, 3);
  const headerLabelClassName = "block min-w-0 truncate leading-tight";
  const hasToolbar = selectionEnabled || headerActions != null;

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
  const leaveSelection = () => {
    onRemoveMultipleFromInitiative?.([...selectedRowIds]);
    clearSelection();
  };

  /** Icon + label; the label is visible from `xl`, below it stays the accessible name and a tooltip. */
  const renderToolbarButton = ({
    label,
    icon,
    onClick,
    pressed,
    variant = "secondary",
  }: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    pressed?: boolean;
    variant?: "secondary" | "destructive";
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="sm"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}>
          {icon}
          <span className="sr-only xl:not-sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="xl:hidden">{label}</TooltipContent>
    </Tooltip>
  );

  // FR-tracker-bulk-actions — selection tools, left side of the card header toolbar.
  const renderSelectionActions = () =>
    bulkVisibilityLabels ? (
      <>
        {groupedInitiativeAvailable && groupedInitiativeLabels
          ? renderToolbarButton({
              label: groupedInitiativeLabels.action,
              icon: (
                <ListOrdered
                  className="size-4"
                  aria-hidden="true"
                />
              ),
              pressed: groupedInitiativeActive,
              onClick: () => setGroupedInitiativeOpen((open) => !open),
            })
          : null}
        {renderGroupedInitiativeBar()}
        {renderToolbarButton({
          label: bulkVisibilityLabels.configure,
          // Same icon as the per-row show button.
          icon: (
            <MonitorCog
              className="size-4"
              aria-hidden="true"
            />
          ),
          onClick: () => setBulkVisibilityOpen(true),
        })}
        {onRemoveMultipleFromInitiative
          ? renderToolbarButton({
              label: bulkVisibilityLabels.leaveInitiative,
              icon: (
                <LogOut
                  className="size-4"
                  aria-hidden="true"
                />
              ),
              onClick: leaveSelection,
              variant: "destructive",
            })
          : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={bulkVisibilityLabels.clearSelection}
              onClick={clearSelection}>
              <X
                className="size-4"
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{bulkVisibilityLabels.clearSelection}</TooltipContent>
        </Tooltip>
      </>
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
        inline
      />
    ) : null;

  const selectAllChecked = allRowsSelected ? true : someRowsSelected ? "indeterminate" : false;

  return (
    <section
      data-slot="tracker-card"
      // `overflow-clip` keeps the rounded corners without making the card a scroll container, so it never
      // shrinks below its content on very short screens (the page scrolls there).
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col overflow-clip rounded-[24px] bg-card text-white shadow-xl",
        TRACKER_FIT_SCREEN_CLASS,
      )}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveAnnouncement}</div>

      <div
        data-slot="tracker-header"
        className="shrink-0">
        {hasToolbar ? (
          // Constant height: selecting rows never moves the table (FR-tracker-bulk-actions).
          <div
            data-slot="tracker-toolbar"
            className={cn(
              "flex min-h-14 w-full min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border sm:gap-3",
              TRACKER_CARD_PADDING_X_CLASS,
              TRACKER_ZONE_PADDING_Y_CLASS,
            )}>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
              {selectionEnabled && bulkVisibilityLabels ? (
                <>
                  {/* Mobile has no column headings: select-all lives in the toolbar. */}
                  <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-white/85 md:hidden">
                    <Checkbox
                      checked={selectAllChecked}
                      aria-label={bulkVisibilityLabels.selectAllRows}
                      onCheckedChange={toggleSelectAllRows}
                      className="size-5 shrink-0 cursor-pointer"
                    />
                    <span
                      className={selectedCount > 0 ? "sr-only" : "truncate"}
                      aria-hidden="true">
                      {bulkVisibilityLabels.selectAllRowsShort}
                    </span>
                  </label>
                  {selectedCount > 0 ? (
                    <div
                      className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2"
                      role="toolbar"
                      aria-label={bulkVisibilityLabels.selectionToolbar}>
                      <TrackerSelectedCount
                        count={selectedCount}
                        label={selectedCountLabel ?? String(selectedCount)}
                      />
                      {renderSelectionActions()}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
            {headerActions ? <div className="ml-auto flex shrink-0 items-center gap-2">{headerActions}</div> : null}
          </div>
        ) : null}

        <div
          data-slot="tracker-headings"
          className={cn(
            "hidden w-full max-w-full min-w-0 items-center border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid",
            TRACKER_GRID_GAP_CLASS,
            TRACKER_CARD_PADDING_X_CLASS,
            TRACKER_ZONE_PADDING_Y_CLASS,
          )}
          style={{ gridTemplateColumns }}>
          {selectionEnabled ? (
            <Checkbox
              checked={selectAllChecked}
              aria-label={bulkVisibilityLabels?.selectAllRows ?? ""}
              onCheckedChange={toggleSelectAllRows}
              className="size-5 cursor-pointer justify-self-start"
            />
          ) : null}
          {!isPlayerView ? (
            <span
              className={`min-w-0 ${TRACKER_HEADER_ALIGN.visible}`}
              title={columnLabels.visible}>
              <span
                className={headerLabelClassName}
                aria-hidden="true">
                {compactVisibleLabel}
              </span>
              <span className="sr-only">{columnLabels.visible}</span>
            </span>
          ) : null}
          <span
            className={`min-w-0 ${TRACKER_HEADER_ALIGN.initiative}`}
            title={columnLabels.initiative}>
            <span
              className={cn(headerLabelClassName, !initiativeLocked && "xl:hidden")}
              aria-hidden="true">
              {compactInitiativeLabel}
            </span>
            <span className={initiativeLocked ? "sr-only" : `${headerLabelClassName} sr-only xl:not-sr-only`}>
              {columnLabels.initiative}
            </span>
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.character}`}
            title={columnLabels.character}>
            {columnLabels.character}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.armorClass}`}
            title={columnLabels.armorClass}>
            {columnLabels.armorClass}
          </span>
          <span
            className={`min-w-0 truncate leading-tight ${TRACKER_HEADER_ALIGN.hitPoints}`}
            title={columnLabels.hitPoints}>
            {columnLabels.hitPoints}
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
      </div>

      <div
        data-slot="tracker-rows"
        role="region"
        aria-label={rowsLabel}
        tabIndex={0}
        // Raised, lighter tone than the card; the only scrolling zone (header and footer stay in place).
        className={cn("flex w-full min-w-0 flex-col bg-gray-middle-light", TRACKER_ROWS_SCROLL_CLASS)}
        onFocusCapture={(event) => {
          if (isInitiativeInputTarget(event.target)) setFrozenOrder((current) => current ?? rows.map((row) => row.id));
        }}
        onBlurCapture={(event) => {
          // Tabbing from one initiative field to another keeps the order frozen.
          if (isInitiativeInputTarget(event.target) && !isInitiativeInputTarget(event.relatedTarget)) {
            setFrozenOrder(null);
          }
        }}
        onKeyDownCapture={(event) => {
          if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
          if (!isInitiativeInputTarget(event.target)) return;
          const next = findAdjacentInitiativeInput(
            getVisibleInitiativeInputs(event.currentTarget),
            event.target as HTMLElement,
            event.shiftKey,
          );
          if (!next) return;
          event.preventDefault();
          next.focus();
          if (next instanceof HTMLInputElement) next.select();
        }}>
        {displayRows.map((row) => {
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
          // Square rows split by a thin line (FR-combat-initiative-tracker table layout).
          const rowWrapperClassName = "min-w-0 border-b border-border last:border-b-0";
          if (isPlayerView || !onRemoveFromInitiative || !bulkVisibilityLabels) {
            return (
              <div
                key={row.id}
                className={rowWrapperClassName}>
                {rowNode}
              </div>
            );
          }
          return (
            <ContextMenu key={row.id}>
              <ContextMenuTrigger asChild>
                <div className={rowWrapperClassName}>{rowNode}</div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel className="max-w-64 truncate">
                  {characterName(row.firstname, row.lastname, row.surname) || row.playerDisplayName}
                </ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => onRemoveFromInitiative(row.id)}>
                  <LogOut aria-hidden="true" />
                  {bulkVisibilityLabels.leaveInitiative}
                </ContextMenuItem>
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
            accept: bulkVisibilityLabels.accept,
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

      {turnControls ? (
        <div
          data-slot="tracker-footer-zone"
          className="shrink-0 border-t border-border">
          {turnControls}
        </div>
      ) : null}
    </section>
  );
}
