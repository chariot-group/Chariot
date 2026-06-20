"use client";

import * as React from "react";

/** Pure helper — exported for unit tests */
export function buildDuplicateGroupLabel(group: { label: string } | null): string {
  if (!group) return "2";
  const base = group.label.trim();
  return base ? `${base} 2` : "2";
}

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface DuplicateGroupDialogProps {
  group: { label: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (label: string, count: number) => Promise<void>;
}

export function DuplicateGroupDialog({
  group,
  open,
  onOpenChange,
  onDuplicate,
}: DuplicateGroupDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const defaultLabel = React.useMemo(() => buildDuplicateGroupLabel(group), [group]);

  const [label, setLabel] = React.useState(defaultLabel);
  const [countStr, setCountStr] = React.useState("1");
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLabel(defaultLabel);
      setCountStr("1");
      setIsCreating(false);
    }
  }, [open, defaultLabel]);

  const count = Math.max(1, Math.min(99, parseInt(countStr, 10) || 1));

  const trimmedLabel = label.trim();
  const canSubmit = trimmedLabel.length > 0 && !isCreating;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      await onDuplicate(trimmedLabel, count);
      onOpenChange(false);
    } catch {
      // error toast handled by caller
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      void handleCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isCreating) onOpenChange(false);
      }}>
      <DialogContent className="sm:max-w-md rounded-[15px] bg-card">
        <DialogHeader>
          <DialogTitle>{t("duplicateGroupDialogTitle")}</DialogTitle>
          <DialogDescription>{t("duplicateGroupDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3 py-2">
          <div className="flex-1 grid gap-2">
            <Label htmlFor="duplicate-group-label">{t("duplicateGroupLabelLabel")}</Label>
            <Input
              id="duplicate-group-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isCreating}
              className="rounded-[12px]"
              aria-label={t("duplicateGroupLabelLabel")}
            />
          </div>
          <div className="w-20 grid gap-2">
            <Label htmlFor="duplicate-group-count">{t("duplicateCharacterCountLabel")}</Label>
            <Input
              id="duplicate-group-count"
              type="number"
              min={1}
              max={99}
              value={countStr}
              onChange={(e) => setCountStr(e.target.value)}
              onBlur={() => setCountStr(String(count))}
              disabled={isCreating}
              className="rounded-[12px]"
              aria-label={t("duplicateCharacterCountLabel")}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleCreate()}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {t("duplicateGroupCreate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
