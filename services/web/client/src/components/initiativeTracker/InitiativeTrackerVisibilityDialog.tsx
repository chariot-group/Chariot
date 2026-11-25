"use client";

import * as React from "react";
import { MonitorCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DIALOG_SECTIONED_CONTENT_CLASS,
  DIALOG_SECTION_BODY_CLASS,
  DIALOG_SECTION_FOOTER_CLASS,
  DIALOG_SECTION_HEADER_CLASS,
  DIALOG_SECTION_TITLE_CLASS,
} from "@/components/ui/dialog-sections";
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
import type {
  InitiativeTrackerPlayerFieldVisibility,
  InitiativeTrackerRow,
} from "@/store/slices/sessionSlice";
import { isSessionParticipantTrackerRow } from "@/components/initiativeTracker/utils";

type FieldKey = keyof InitiativeTrackerPlayerFieldVisibility;

type InitiativeTrackerVisibilityDialogProps = {
  row: InitiativeTrackerRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: {
    title: string;
    showToPlayers: string;
    playerDisplayName: string;
    playerDisplayNameHint: string;
    playerDisplayNamePlaceholder: string;
    playerRowVisibilityHint: string;
    leaveInitiative: string;
    fields: Record<FieldKey, string>;
    apply: string;
    cancel: string;
    configureFor: string;
  };
  onApply: (
    visible: boolean,
    playerFieldVisibility: InitiativeTrackerPlayerFieldVisibility,
    playerDisplayName: string,
  ) => void;
  onLeaveInitiative?: () => void;
};

const FIELD_KEYS: FieldKey[] = [
  "name",
  "initiative",
  "hitPoints",
  "lifeStatus",
  "armorClass",
  "conditions",
  "concentration",
  "groupLabel",
];

export function InitiativeTrackerVisibilityDialog({
  row,
  open,
  onOpenChange,
  labels,
  onApply,
  onLeaveInitiative,
}: InitiativeTrackerVisibilityDialogProps) {
  const isSessionParticipantRow = isSessionParticipantTrackerRow(row);
  const [visible, setVisible] = React.useState(row.visible);
  const [fields, setFields] = React.useState<InitiativeTrackerPlayerFieldVisibility>(
    () => ({ ...row.playerFieldVisibility }),
  );
  const [playerDisplayName, setPlayerDisplayName] = React.useState(row.playerDisplayName ?? "");

  React.useEffect(() => {
    if (!open) return;
    setVisible(row.visible);
    setFields({ ...row.playerFieldVisibility });
    setPlayerDisplayName(row.playerDisplayName ?? "");
  }, [open, row]);

  const toggleField = (key: FieldKey, checked: boolean) => {
    setFields((current) => ({ ...current, [key]: checked }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_SECTIONED_CONTENT_CLASS, "sm:max-w-md")}>
        <DialogHeader className={DIALOG_SECTION_HEADER_CLASS}>
          <DialogTitle className={DIALOG_SECTION_TITLE_CLASS}>{labels.title}</DialogTitle>
        </DialogHeader>

        <div className={cn("flex flex-col gap-4", DIALOG_SECTION_BODY_CLASS)}>
          <p className="text-sm text-white/70">{labels.configureFor}</p>
          {isSessionParticipantRow ? (
            <p className="text-sm text-white/65">{labels.playerRowVisibilityHint}</p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="visibility-player-display-name"
              className="text-sm font-medium">
              {labels.playerDisplayName}
            </Label>
            <Input
              id="visibility-player-display-name"
              value={playerDisplayName}
              onChange={(event) => setPlayerDisplayName(event.target.value)}
              placeholder={labels.playerDisplayNamePlaceholder}
              disabled={!visible}
              className="rounded-[15px] bg-gray-middle-light text-white"
            />
            <p className="text-xs text-white/55">{labels.playerDisplayNameHint}</p>
          </div>

          {!isSessionParticipantRow ? (
            <>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="visibility-show-row"
                  checked={visible}
                  onCheckedChange={(checked) => setVisible(Boolean(checked))}
                  className="size-5 cursor-pointer"
                />
                <Label
                  htmlFor="visibility-show-row"
                  className="cursor-pointer text-sm font-medium">
                  {labels.showToPlayers}
                </Label>
              </div>

              <fieldset
                className="flex flex-col gap-2.5 rounded-[15px] border border-white/10 p-4"
                disabled={!visible}>
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-white/55">
                  {labels.title}
                </legend>
                {FIELD_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-3">
                    <Checkbox
                      id={`visibility-field-${key}`}
                      checked={fields[key]}
                      disabled={!visible}
                      onCheckedChange={(checked) => toggleField(key, Boolean(checked))}
                      className="size-5 cursor-pointer"
                    />
                    <Label
                      htmlFor={`visibility-field-${key}`}
                      className="cursor-pointer text-sm">
                      {labels.fields[key]}
                    </Label>
                  </div>
                ))}
              </fieldset>
            </>
          ) : null}

          {onLeaveInitiative ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                onLeaveInitiative();
                onOpenChange(false);
              }}>
              {labels.leaveInitiative}
            </Button>
          ) : null}
        </div>

        <DialogFooter className={cn("gap-2 sm:gap-2", DIALOG_SECTION_FOOTER_CLASS)}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(visible, fields, playerDisplayName.trim());
              onOpenChange(false);
            }}>
            {labels.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type VisibilityTriggerButtonProps = {
  row: InitiativeTrackerRow;
  ariaLabel: string;
  onClick: () => void;
};

export function VisibilityTriggerButton({ row, ariaLabel, onClick }: VisibilityTriggerButtonProps) {
  const iconClass = row.visible ? "text-green" : "text-white/45";

  return (
    // FR-combat-initiative-tracker — row buttons read as real buttons; icon keeps its state color.
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      onClick={onClick}
      className="shrink-0">
      <MonitorCog
        aria-hidden="true"
        className={`size-4 ${iconClass}`}
      />
    </Button>
  );
}
