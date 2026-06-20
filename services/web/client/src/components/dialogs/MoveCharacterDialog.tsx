"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Group } from "@/types/campaign";
import { moveCharacterToGroup } from "@/lib/moveCharacterToGroup";
import GroupService from "@/services/GroupService";

interface MoveCharacterDialogProps {
  character: { _id: string; firstname: string; lastname: string } | null;
  campaignId: string | null;
  currentGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved?: () => void | Promise<void>;
  onMovedToGroup?: (targetGroupId: string) => void | Promise<void>;
}

export type MoveTargetGroup = Group & { isArchived: boolean };

export function filterMoveTargetGroups(groups: MoveTargetGroup[], currentGroupId: string): MoveTargetGroup[] {
  return groups.filter((group) => group._id !== currentGroupId);
}

export function sortMoveTargetGroups(groups: MoveTargetGroup[]): MoveTargetGroup[] {
  return [...groups].sort((left, right) => {
    if (left.isArchived !== right.isArchived) {
      return left.isArchived ? 1 : -1;
    }

    return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
  });
}

export async function fetchMoveTargetGroups(campaignId: string): Promise<MoveTargetGroup[]> {
  const [activeGroups, archivedGroups] = await Promise.all([
    GroupService.getAllGroupsByCampaign(campaignId, "active"),
    GroupService.getAllGroupsByCampaign(campaignId, "archived"),
  ]);

  return sortMoveTargetGroups([
    ...activeGroups.map((group) => ({ ...group, isArchived: false })),
    ...archivedGroups.map((group) => ({ ...group, isArchived: true })),
  ]);
}

export function buildMoveGroupOptions(
  groups: MoveTargetGroup[],
  archivedBadgeLabel: string,
): SearchableSelectOption[] {
  return groups.map((group) => ({
    value: group._id,
    label: group.label,
    description: group.isArchived ? archivedBadgeLabel : undefined,
    inputLabel: group.isArchived ? `${group.label} (${archivedBadgeLabel})` : group.label,
  }));
}

export function MoveCharacterDialog({
  character,
  campaignId,
  currentGroupId,
  open,
  onOpenChange,
  onMoved,
  onMovedToGroup,
}: MoveCharacterDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const [targetGroups, setTargetGroups] = React.useState<MoveTargetGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [isMoving, setIsMoving] = React.useState(false);

  const availableGroups = React.useMemo(
    () => filterMoveTargetGroups(targetGroups, currentGroupId),
    [currentGroupId, targetGroups],
  );

  React.useEffect(() => {
    if (!open || !campaignId) {
      setTargetGroups([]);
      return;
    }

    let mounted = true;
    const loadTargetGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const groups = await fetchMoveTargetGroups(campaignId);
        if (mounted) {
          setTargetGroups(groups);
        }
      } catch (error) {
        console.error("Error loading target groups for move:", error);
        if (mounted) {
          setTargetGroups([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingGroups(false);
        }
      }
    };

    void loadTargetGroups();
    return () => {
      mounted = false;
    };
  }, [campaignId, open]);

  React.useEffect(() => {
    if (open) {
      setSelectedGroupId(null);
    }
  }, [open]);

  const handleMove = async () => {
    if (!character || !selectedGroupId || isMoving) return;

    setIsMoving(true);
    try {
      await moveCharacterToGroup(character._id, currentGroupId, selectedGroupId);
      await onMovedToGroup?.(selectedGroupId);
      await onMoved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving character:", error);
    } finally {
      setIsMoving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === "Enter" && !isMoving && !isLoadingGroups && selectedGroupId) {
      event.preventDefault();
      void handleMove();
    }
  };

  const groupOptions = React.useMemo(
    () => buildMoveGroupOptions(availableGroups, t("moveCharacterArchivedGroupBadge")),
    [availableGroups, t],
  );

  const moveGroupSelectId = React.useId();
  const moveGroupLabelId = `${moveGroupSelectId}-label`;

  const displayName =
    [character?.firstname, character?.lastname]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" ") || t("unnamedCharacter");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isMoving) onOpenChange(false);
      }}>
      <DialogContent
        className="sm:max-w-md rounded-[15px] bg-card"
        onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{t("moveCharacterDialogTitle")}</DialogTitle>
          <DialogDescription>{t("moveCharacterDialogDescription", { name: displayName })}</DialogDescription>
        </DialogHeader>

        {isLoadingGroups ? (
          <div
            className="flex items-center justify-center py-6"
            aria-busy="true"
            aria-label={t("moveCharacterSelectGroup")}>
            <Loader2
              className="h-5 w-5 animate-spin text-white/50"
              aria-hidden
            />
          </div>
        ) : availableGroups.length === 0 ? (
          <p className="text-sm text-white/60">{t("moveCharacterNoTargetGroups")}</p>
        ) : (
          <div className="grid gap-2 py-2">
            <Label
              id={moveGroupLabelId}
              htmlFor={moveGroupSelectId}>
              {t("moveCharacterSelectGroup")}
            </Label>
            <SearchableSelect
              id={moveGroupSelectId}
              aria-labelledby={moveGroupLabelId}
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              options={groupOptions}
              placeholder={t("moveCharacterSelectGroup")}
              searchPlaceholder={t("moveCharacterSearchGroupPlaceholder")}
              emptyText={t("moveCharacterNoSearchResult")}
              disabled={isMoving}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isMoving}
            onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isMoving || isLoadingGroups || !selectedGroupId || availableGroups.length === 0}
            onClick={() => void handleMove()}>
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("moveCharacterConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
