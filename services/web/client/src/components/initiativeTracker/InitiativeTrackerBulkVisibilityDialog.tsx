"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InitiativeTrackerPlayerFieldVisibility } from "@/store/slices/sessionSlice";

type FieldKey = keyof InitiativeTrackerPlayerFieldVisibility;

type InitiativeTrackerBulkVisibilityDialogProps = {
  open: boolean;
  selectedCount: number;
  labels: {
    title: string;
    description: string;
    showToPlayers: string;
    playerDisplayName: string;
    playerDisplayNameHint: string;
    playerDisplayNamePlaceholder: string;
    fieldsTitle: string;
    emptySelection: string;
    apply: string;
    cancel: string;
    leaveInitiative: string;
    fields: Record<FieldKey, string>;
  };
  onOpenChange: (open: boolean) => void;
  onApply: (
    visible: boolean,
    playerFieldVisibility: InitiativeTrackerPlayerFieldVisibility,
    playerDisplayName: string,
  ) => void;
  onLeaveInitiative: () => void;
};

const FIELD_KEYS: FieldKey[] = [
  "name",
  "initiative",
  "hitPoints",
  "armorClass",
  "conditions",
  "groupLabel",
];

const DEFAULT_BULK_FIELDS: InitiativeTrackerPlayerFieldVisibility = {
  initiative: false,
  name: true,
  hitPoints: false,
  armorClass: false,
  conditions: false,
  groupLabel: false,
};

export function InitiativeTrackerBulkVisibilityDialog({
  open,
  selectedCount,
  labels,
  onOpenChange,
  onApply,
  onLeaveInitiative,
}: InitiativeTrackerBulkVisibilityDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      {open ? (
        <InitiativeTrackerBulkVisibilityDialogContent
          selectedCount={selectedCount}
          labels={labels}
          onOpenChange={onOpenChange}
          onApply={onApply}
          onLeaveInitiative={onLeaveInitiative}
        />
      ) : null}
    </Dialog>
  );
}

function InitiativeTrackerBulkVisibilityDialogContent({
  selectedCount,
  labels,
  onOpenChange,
  onApply,
  onLeaveInitiative,
}: Omit<InitiativeTrackerBulkVisibilityDialogProps, "open">) {
  const [visible, setVisible] = React.useState(true);
  const [fields, setFields] = React.useState<InitiativeTrackerPlayerFieldVisibility>(
    () => ({ ...DEFAULT_BULK_FIELDS }),
  );
  const [playerDisplayName, setPlayerDisplayName] = React.useState("");

  const toggleField = (key: FieldKey, checked: boolean) => {
    setFields((current) => ({ ...current, [key]: checked }));
  };

  const hasSelection = selectedCount > 0;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{labels.title}</DialogTitle>
        <p className="text-sm text-white/70">{labels.description}</p>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        {!hasSelection ? (
          <p
            role="alert"
            className="rounded-[15px] border border-red/35 bg-red/10 px-3 py-2 text-sm text-red">
            {labels.emptySelection}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Checkbox
            id="bulk-visibility-show-row"
            checked={visible}
            onCheckedChange={(checked) => setVisible(Boolean(checked))}
            className="size-5 cursor-pointer"
          />
          <Label
            htmlFor="bulk-visibility-show-row"
            className="cursor-pointer text-sm font-medium">
            {labels.showToPlayers}
          </Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="bulk-visibility-player-display-name"
            className="text-sm font-medium">
            {labels.playerDisplayName}
          </Label>
          <Input
            id="bulk-visibility-player-display-name"
            value={playerDisplayName}
            onChange={(event) => setPlayerDisplayName(event.target.value)}
            placeholder={labels.playerDisplayNamePlaceholder}
            disabled={!visible}
            className="rounded-[15px] bg-gray-middle-light text-white"
          />
          <p className="text-xs text-white/55">{labels.playerDisplayNameHint}</p>
        </div>

        <fieldset
          className="flex flex-col gap-2.5 rounded-[15px] border border-white/10 p-4"
          disabled={!visible}>
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-white/55">
            {labels.fieldsTitle}
          </legend>
          {FIELD_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3">
              <Checkbox
                id={`bulk-visibility-field-${key}`}
                checked={fields[key]}
                disabled={!visible}
                onCheckedChange={(checked) => toggleField(key, Boolean(checked))}
                className="size-5 cursor-pointer"
              />
              <Label
                htmlFor={`bulk-visibility-field-${key}`}
                className="cursor-pointer text-sm">
                {labels.fields[key]}
              </Label>
            </div>
          ))}
        </fieldset>

        <Button
          type="button"
          variant="outline"
          disabled={!hasSelection}
          className="w-full rounded-[15px] border-red/40 text-red hover:bg-red/15 hover:text-red"
          onClick={() => {
            onLeaveInitiative();
            onOpenChange(false);
          }}>
          {labels.leaveInitiative}
        </Button>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}>
          {labels.cancel}
        </Button>
        <Button
          type="button"
          disabled={!hasSelection}
          onClick={() => {
            onApply(visible, fields, playerDisplayName.trim());
            onOpenChange(false);
          }}>
          {labels.apply}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
