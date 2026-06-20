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
import { Card } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { AddCombatantsGroupMembers } from "@/components/dialogs/AddCombatantsGroupMembers";
import groupService from "@/services/GroupService";
import characterService from "@/services/CharacterService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import {
  appendInitiativeTrackerRows,
  createInitiativeTrackerRow,
  selectCurrentSession,
  selectInitiativeTrackerRows,
  selectSessionParticipantDisplayNames,
  selectGmGuestCharacterIds,
} from "@/store/slices/sessionSlice";
import {
  buildSessionParticipantsGroup,
  type SessionParticipantsGroupCharacter,
} from "@/lib/buildSessionParticipantsGroup";
import { Group } from "@/types/campaign";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Character } from "@/types/character";
import {
  trackerDeathSavesFailuresFromCharacter,
  trackerKindFromCharacter,
} from "@/components/initiativeTracker/utils";

type BattleGroupCharacter = SessionParticipantsGroupCharacter;

type BattleGroup = Omit<Group, "characters"> & {
  characters: BattleGroupCharacter[];
};

const parseChallengeRating = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.includes("/")) {
      const [numRaw, denRaw] = trimmed.split("/");
      const num = Number(numRaw);
      const den = Number(denRaw);
      if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
    }
    const parsed = Number(trimmed.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isNpcCharacter = (character: BattleGroupCharacter): boolean => {
  const cr = parseChallengeRating(character.challenge?.challengeRating);
  return cr > 0 || !character.createdBy || !!character.profile?.type;
};

interface AddCombatantsDialogProps {
  children: React.ReactNode;
}

export function AddCombatantsDialog({ children }: AddCombatantsDialogProps) {
  const t = useTranslations("initTracker.tracker");
  const tInit = useTranslations("initTracker");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const session = useAppSelector(selectCurrentSession);
  const participantDisplayNames = useAppSelector(selectSessionParticipantDisplayNames);
  const gmGuestCharacterIds = useAppSelector(selectGmGuestCharacterIds);
  const trackerRows = useAppSelector(selectInitiativeTrackerRows);

  const inCombatCharacterIds = React.useMemo(
    () => new Set(trackerRows.map((row) => row.characterId)),
    [trackerRows],
  );

  const groupIdsInInitiative = React.useMemo(
    () => new Set(trackerRows.map((row) => row.groupId)),
    [trackerRows],
  );

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [groups, setGroups] = React.useState<BattleGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = React.useState<string[]>([]);
  const [excludedMembersByGroup, setExcludedMembersByGroup] = React.useState<Record<string, string[]>>({});
  const [initiativeByMemberId, setInitiativeByMemberId] = React.useState<Record<string, number>>({});
  const dialogInitializedRef = React.useRef(false);

  const eligibleGroups = React.useMemo(
    () =>
      groups.filter((group) =>
        (group.characters ?? []).some((member) => !inCombatCharacterIds.has(member._id)),
      ),
    [groups, inCombatCharacterIds],
  );

  const sortedEligibleGroups = React.useMemo(() => {
    return [...eligibleGroups].sort((a, b) => {
      const aPriority = groupIdsInInitiative.has(a._id) ? 0 : 1;
      const bPriority = groupIdsInInitiative.has(b._id) ? 0 : 1;
      return aPriority - bPriority || a.label.localeCompare(b.label);
    });
  }, [eligibleGroups, groupIdsInInitiative]);

  const groupOptions = React.useMemo(
    () =>
      sortedEligibleGroups.map((group) => ({
        value: group._id,
        label: group.label,
      })),
    [sortedEligibleGroups],
  );

  const selectedGroups = React.useMemo(() => {
    const ids = new Set(selectedGroupIds);
    return sortedEligibleGroups.filter((group) => ids.has(group._id));
  }, [sortedEligibleGroups, selectedGroupIds]);

  const canValidate = React.useMemo(() => {
    return selectedGroups.some((group) => {
      const excluded = new Set(excludedMembersByGroup[group._id] ?? []);
      return (group.characters ?? []).some(
        (member) => !inCombatCharacterIds.has(member._id) && !excluded.has(member._id),
      );
    });
  }, [excludedMembersByGroup, inCombatCharacterIds, selectedGroups]);

  React.useEffect(() => {
    if (!open || !selectedCampaignId) return;

    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const allGroups = (await groupService.getAllGroupsByCampaign(selectedCampaignId, "active")) as BattleGroup[];
        if (!mounted) return;
        const sessionGroup = await buildSessionParticipantsGroup(
          allGroups,
          session?.participants ?? [],
          selectedCampaignId,
          participantDisplayNames,
          session?.code,
          gmGuestCharacterIds,
        );
        setGroups([...allGroups, sessionGroup]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [open, selectedCampaignId, session?.code, session?.participants, gmGuestCharacterIds, participantDisplayNames]);

  React.useEffect(() => {
    if (!open) {
      dialogInitializedRef.current = false;
      return;
    }
    if (isLoading || groups.length === 0 || dialogInitializedRef.current) return;

    const defaultGroupIds = eligibleGroups
      .filter((group) => groupIdsInInitiative.has(group._id))
      .map((group) => group._id);

    setSelectedGroupIds(defaultGroupIds);
    setExpandedGroupIds(defaultGroupIds);
    setExcludedMembersByGroup({});
    setInitiativeByMemberId({});
    dialogInitializedRef.current = true;
  }, [open, isLoading, groups.length, eligibleGroups, groupIdsInInitiative]);

  const handleSelectedGroupIdsChange = (nextGroupIds: string[]) => {
    const valid = new Set(sortedEligibleGroups.map((g) => g._id));
    const sanitized = nextGroupIds.filter((id) => valid.has(id));
    setSelectedGroupIds(sanitized);
    setExpandedGroupIds((current) => current.filter((id) => sanitized.includes(id)));
    setExcludedMembersByGroup((current) =>
      Object.fromEntries(Object.entries(current).filter(([groupId]) => sanitized.includes(groupId))),
    );
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  };

  const toggleMember = (groupId: string, memberId: string, include: boolean) => {
    setExcludedMembersByGroup((current) => {
      const excluded = new Set(current[groupId] ?? []);
      if (include) excluded.delete(memberId);
      else excluded.add(memberId);
      return { ...current, [groupId]: Array.from(excluded) };
    });
    if (include && initiativeByMemberId[memberId] == null) {
      setInitiativeByMemberId((current) => ({ ...current, [memberId]: 0 }));
    }
  };

  const setMemberInitiative = (memberId: string, value: number) => {
    setInitiativeByMemberId((current) => ({
      ...current,
      [memberId]: Number.isFinite(value) ? value : 0,
    }));
  };

  const applyGroupInitiative = (groupId: string, initiative: number) => {
    const group = groups.find((item) => item._id === groupId);
    if (!group) return;

    const excluded = new Set(excludedMembersByGroup[groupId] ?? []);
    const updates: Record<string, number> = {};
    (group.characters ?? []).forEach((member) => {
      if (inCombatCharacterIds.has(member._id) || excluded.has(member._id)) return;
      updates[member._id] = initiative;
    });
    setInitiativeByMemberId((current) => ({ ...current, ...updates }));
  };

  const clearGroupMemberSelection = (groupId: string, memberIds: string[]) => {
    setExcludedMembersByGroup((current) => ({
      ...current,
      [groupId]: memberIds,
    }));
  };

  const resolveMemberInitiative = (memberId: string): number => {
    const value = initiativeByMemberId[memberId];
    return Number.isFinite(value) ? value : 0;
  };

  const handleAdd = async () => {
    if (!canValidate || isValidating) return;
    setIsValidating(true);
    try {
      const membersToAdd = new Map<string, BattleGroupCharacter>();
      selectedGroups.forEach((group) => {
        const excluded = new Set(excludedMembersByGroup[group._id] ?? []);
        (group.characters ?? []).forEach((member) => {
          if (inCombatCharacterIds.has(member._id) || excluded.has(member._id)) return;
          membersToAdd.set(member._id, member);
        });
      });

      const detailsById = new Map<string, Character>();
      const details = await Promise.allSettled(
        Array.from(membersToAdd.values()).map(async (member) => {
          if (member.stats) return member as Character;
          return characterService.getCharacterById(member._id, { sessionCode: session?.code });
        }),
      );
      details.forEach((result) => {
        if (result.status === "fulfilled") detailsById.set(result.value._id, result.value);
      });

      const rows = selectedGroups.flatMap((group) => {
        const excluded = new Set(excludedMembersByGroup[group._id] ?? []);
        return (group.characters ?? [])
          .filter((member) => !inCombatCharacterIds.has(member._id) && !excluded.has(member._id))
          .map((member) => {
            const character = detailsById.get(member._id) ?? member;
            const stats = character.stats;
            const currentHitPoints = stats?.currentHitPoints;
            const maxHitPoints = stats?.maxHitPoints;
            const tempHitPoints = stats?.tempHitPoints;
            const armorClass = stats?.armorClass;
            const hydrated = detailsById.get(member._id);
            const isHydrated = hydrated != null && "stats" in hydrated && hydrated.stats != null;
            const kind = isHydrated
              ? trackerKindFromCharacter(hydrated as Character)
              : isNpcCharacter(member)
                ? "npc"
                : "player";

            return createInitiativeTrackerRow({
              groupId: group._id,
              groupLabel: group.label,
              characterId: member._id,
              firstname: character.firstname ?? "",
              lastname: character.lastname ?? "",
              surname: character.surname ?? "",
              avatar: character.avatar ?? "",
              initiative: resolveMemberInitiative(member._id),
              hitPoints: Number.isFinite(currentHitPoints)
                ? Number(currentHitPoints)
                : Number(maxHitPoints ?? 0),
              maxHitPoints: Number.isFinite(maxHitPoints) ? Number(maxHitPoints) : 0,
              tempHitPoints: Number.isFinite(tempHitPoints) ? Number(tempHitPoints) : 0,
              armorClass: Number.isFinite(armorClass) ? Number(armorClass) : 0,
              kind,
              deathSavesFailures: isHydrated
                ? trackerDeathSavesFailuresFromCharacter(hydrated as Character)
                : 0,
            });
          });
      });

      dispatch(appendInitiativeTrackerRows(rows));
      setOpen(false);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="!flex h-[min(88dvh,760px)] flex-col p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("addCombatantsDialogTitle")}</DialogTitle>
          {groupIdsInInitiative.size > 0 ? (
            <p className="text-sm text-white/65">{t("addCombatantsGroupsInCombatHint")}</p>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {eligibleGroups.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">{t("addCombatantsNoEligible")}</p>
          ) : (
            <>
              <MultiSelect
                value={selectedGroupIds}
                onChange={handleSelectedGroupIdsChange}
                options={groupOptions}
                placeholder={t("addCombatantsSearchGroupPlaceholder")}
                searchPlaceholder={t("addCombatantsSearchGroupPlaceholder")}
                emptyText={tInit("initBattleNoSearchResult")}
                selectAllLabel={t("addCombatantsSelectAllGroups")}
              />

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {tInit("initBattleLoadingGroups")}
                  </div>
                ) : selectedGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("addCombatantsNoGroupSelected")}</p>
                ) : (
                  selectedGroups.map((group) => {
                    const availableMembers = (group.characters ?? []).filter(
                      (m) => !inCombatCharacterIds.has(m._id),
                    );
                    const excluded = new Set(excludedMembersByGroup[group._id] ?? []);
                    const isExpanded = expandedGroupIds.includes(group._id);
                    return (
                      <Card
                        key={group._id}
                        className="rounded-[24px] bg-gray-middle-light p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroupExpanded(group._id)}
                          className="flex w-full items-center justify-between gap-2 text-left hover:cursor-pointer">
                          <span className="truncate font-semibold">{group.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="size-4 shrink-0" />
                          ) : (
                            <ChevronRight className="size-4 shrink-0" />
                          )}
                        </button>

                        {isExpanded ? (
                          <div className="mt-2">
                            {availableMembers.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t("addCombatantsAllInCombat")}</p>
                            ) : (
                              <AddCombatantsGroupMembers
                                members={availableMembers}
                                excludedMemberIds={excluded}
                                initiativeByMemberId={initiativeByMemberId}
                                labels={{
                                  initiative: t("initiative"),
                                  character: t("character"),
                                  initiativeFor: t("addCombatantsInitiativeFor"),
                                  groupedSelectedCount: t("groupedInitiativeSelectedCount", {
                                    count: availableMembers.filter((m) => !excluded.has(m._id)).length,
                                  }),
                                  groupedInitiativePlaceholder: t("groupedInitiativePlaceholder"),
                                  groupedInitiativeApply: t("groupedInitiativeApply"),
                                  groupedClearSelection: t("groupedInitiativeClearSelection"),
                                }}
                                onToggleMember={(memberId, include) =>
                                  toggleMember(group._id, memberId, include)
                                }
                                onMemberInitiativeChange={setMemberInitiative}
                                onApplyGroupInitiative={(initiative) =>
                                  applyGroupInitiative(group._id, initiative)
                                }
                                onClearMemberSelection={() =>
                                  clearGroupMemberSelection(
                                    group._id,
                                    availableMembers.map((m) => m._id),
                                  )
                                }
                              />
                            )}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button
            disabled={!canValidate || isValidating || eligibleGroups.length === 0}
            onClick={handleAdd}>
            {isValidating ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("addCombatantsConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
