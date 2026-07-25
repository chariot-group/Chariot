"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { SESSION_PARTICIPANTS_GROUP_ID } from "@/components/initiativeTracker/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeInitiativeTrackerGroups,
  selectInitiativeTrackerRows,
} from "@/store/slices/sessionSlice";
import { useTranslations } from "next-intl";

interface RemoveCombatantGroupsDialogProps {
  children: React.ReactNode;
}

type RemovableGroupOption = {
  value: string;
  label: string;
  memberCount: number;
};

/**
 * FR-combat-initiative-tracker — remove whole groups from the initiative roster
 * (before or after combat start). Session participants group is never listed.
 */
export function RemoveCombatantGroupsDialog({ children }: RemoveCombatantGroupsDialogProps) {
  const t = useTranslations("initTracker.tracker");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const trackerRows = useAppSelector(selectInitiativeTrackerRows);

  const [open, setOpen] = React.useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);

  const removableGroups = React.useMemo((): RemovableGroupOption[] => {
    const byId = new Map<string, RemovableGroupOption>();
    for (const row of trackerRows) {
      if (row.groupId === SESSION_PARTICIPANTS_GROUP_ID) continue;
      const existing = byId.get(row.groupId);
      if (existing) {
        existing.memberCount += 1;
        continue;
      }
      byId.set(row.groupId, {
        value: row.groupId,
        label: row.groupLabel || row.groupId,
        memberCount: 1,
      });
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [trackerRows]);

  const groupOptions = React.useMemo(
    () =>
      removableGroups.map((group) => ({
        value: group.value,
        label: t("removeCombatantGroupsOption", {
          label: group.label,
          count: group.memberCount,
        }),
      })),
    [removableGroups, t],
  );

  React.useEffect(() => {
    if (!open) {
      setSelectedGroupIds([]);
      return;
    }
    const valid = new Set(removableGroups.map((group) => group.value));
    setSelectedGroupIds((current) => current.filter((id) => valid.has(id)));
  }, [open, removableGroups]);

  const canValidate = selectedGroupIds.length > 0 && removableGroups.length > 0;

  const handleRemove = () => {
    if (!canValidate) return;
    dispatch(removeInitiativeTrackerGroups(selectedGroupIds));
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("removeCombatantGroupsDialogTitle")}</DialogTitle>
          <p className="text-sm text-white/65">{t("removeCombatantGroupsDescription")}</p>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {removableGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("removeCombatantGroupsEmpty")}</p>
          ) : (
            <MultiSelect
              value={selectedGroupIds}
              onChange={setSelectedGroupIds}
              options={groupOptions}
              placeholder={t("removeCombatantGroupsPlaceholder")}
              searchPlaceholder={t("removeCombatantGroupsPlaceholder")}
              emptyText={t("removeCombatantGroupsNoSearchResult")}
              selectAllLabel={t("removeCombatantGroupsSelectAll")}
            />
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
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
