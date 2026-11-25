"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DIALOG_SECTIONED_CONTENT_CLASS,
  DIALOG_SECTION_BODY_CLASS,
  DIALOG_SECTION_FOOTER_CLASS,
  DIALOG_SECTION_HEADER_CLASS,
  DIALOG_SECTION_TITLE_CLASS,
} from "@/components/ui/dialog-sections";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRemovableTrackerGroups } from "@/components/initiativeTracker/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeInitiativeTrackerGroups,
  selectInitiativeTrackerRows,
} from "@/store/slices/sessionSlice";
import { useTranslations } from "next-intl";

interface RemoveCombatantGroupsDialogProps {
  children: React.ReactNode;
}

/**
 * FR-combat-initiative-tracker — remove whole groups from the initiative roster
 * (before or after combat start), one at a time via a select. Session participants group is never listed.
 */
export function RemoveCombatantGroupsDialog({ children }: RemoveCombatantGroupsDialogProps) {
  const t = useTranslations("initTracker.tracker");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const trackerRows = useAppSelector(selectInitiativeTrackerRows);

  const [open, setOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string>("");

  const removableGroups = React.useMemo(() => getRemovableTrackerGroups(trackerRows), [trackerRows]);

  React.useEffect(() => {
    if (!open || !removableGroups.some((group) => group.value === selectedGroupId)) {
      setSelectedGroupId("");
    }
  }, [open, removableGroups, selectedGroupId]);

  const canValidate = selectedGroupId !== "";

  const handleRemove = () => {
    if (!canValidate) return;
    dispatch(removeInitiativeTrackerGroups([selectedGroupId]));
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn(DIALOG_SECTIONED_CONTENT_CLASS, "sm:max-w-lg")}>
        <DialogHeader className={DIALOG_SECTION_HEADER_CLASS}>
          <DialogTitle className={DIALOG_SECTION_TITLE_CLASS}>{t("removeCombatantGroupsDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className={cn("flex flex-col gap-3", DIALOG_SECTION_BODY_CLASS)}>
          <p className="text-sm text-white/65">{t("removeCombatantGroupsDescription")}</p>
          {removableGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("removeCombatantGroupsEmpty")}</p>
          ) : (
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}>
              <SelectTrigger
                className="w-full"
                aria-label={t("removeCombatantGroupsPlaceholder")}>
                <SelectValue placeholder={t("removeCombatantGroupsPlaceholder")} />
              </SelectTrigger>
              <SelectContent position="popper">
                {removableGroups.map((group) => (
                  <SelectItem
                    key={group.value}
                    value={group.value}>
                    {t("removeCombatantGroupsOption", { label: group.label, count: group.memberCount })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className={DIALOG_SECTION_FOOTER_CLASS}>
          <DialogClose asChild>
            <Button variant="secondary">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!canValidate}
            onClick={handleRemove}>
            {t("removeCombatantGroupsConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
