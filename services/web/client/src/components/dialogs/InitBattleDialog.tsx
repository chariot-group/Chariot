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
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { MultiSelect } from "../ui/multi-select";
import groupService from "@/services/GroupService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { selectCurrentSession, setSessionInitBattleDraft } from "@/store/slices/sessionSlice";
import { Group } from "@/types/campaign";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { SessionParticipant } from "@/services/SessionService";
import characterService from "@/services/CharacterService";

type BattleGroupCharacter = {
  _id: string;
  firstname?: string;
  lastname?: string;
  surname?: string;
  userId?: string;
  challenge?: {
    challengeRating?: number | string;
  };
  profile?: {
    type?: string;
  };
};

type BattleGroup = Omit<Group, "characters"> & {
  characters: BattleGroupCharacter[];
};

const SESSION_PARTICIPANTS_GROUP_ID = "__session_participants__";
const SESSION_PARTICIPANTS_GROUP_LABEL = "Participants session";

const sanitizeGroupIds = (nextGroupIds: string[], allGroups: BattleGroup[], mandatoryIds: string[]): string[] => {
  const validGroupIds = new Set(allGroups.map((group) => group._id));
  const sanitized = new Set(nextGroupIds.filter((groupId) => validGroupIds.has(groupId)));

  mandatoryIds.forEach((groupId) => {
    if (validGroupIds.has(groupId)) {
      sanitized.add(groupId);
    }
  });

  return Array.from(sanitized);
};

const parseChallengeRating = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    if (trimmed.includes("/")) {
      const [numRaw, denRaw] = trimmed.split("/");
      const num = Number(numRaw);
      const den = Number(denRaw);
      if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
        return num / den;
      }
    }

    const parsed = Number(trimmed.replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const getNpcCr = (character: BattleGroupCharacter): number => {
  const cr = parseChallengeRating(character.challenge?.challengeRating);
  const isNpc = cr > 0 || !character.userId || !!character.profile?.type;
  return isNpc ? cr : 0;
};

const formatCharacterName = (character: BattleGroupCharacter): string => {
  const fullName = `${character.firstname ?? ""} ${character.lastname ?? ""}`.trim();
  return fullName || character.surname || "-";
};

const formatCr = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  if (Math.floor(value) === value) return `${value}`;
  return `${Math.round(value * 100) / 100}`;
};

interface InitBattleDialogProps {
  children: React.ReactNode;
}

const buildSessionParticipantsGroup = async (
  allGroups: BattleGroup[],
  participants: SessionParticipant[],
  campaignId: string,
  sessionCode?: string | null,
): Promise<BattleGroup> => {
  const nonGameMasterParticipants = participants.filter((participant) => participant.status !== "gameMaster");

  const characterById = new Map<string, BattleGroupCharacter>();
  allGroups.forEach((group) => {
    (group.characters ?? []).forEach((character) => {
      characterById.set(character._id, character);
    });
  });

  const missingCharacterIds = Array.from(
    new Set(
      nonGameMasterParticipants
        .map((participant) => participant.characterId)
        .filter((characterId): characterId is string => Boolean(characterId && !characterById.has(characterId))),
    ),
  );

  const fetchedCharacters = await Promise.allSettled(
    missingCharacterIds.map((characterId) => characterService.getCharacterById(characterId, { sessionCode })),
  );

  const fetchedCharacterById = new Map<string, BattleGroupCharacter>();
  fetchedCharacters.forEach((result) => {
    if (result.status !== "fulfilled") return;

    const character = result.value;
    fetchedCharacterById.set(character._id, {
      _id: character._id,
      firstname: character.firstname,
      lastname: character.lastname,
      surname: character.surname,
      userId: character.createdBy,
    });
  });

  const uniqueCharacters = new Map<string, BattleGroupCharacter>();
  nonGameMasterParticipants.forEach((participant) => {
    const characterId = participant.characterId ?? `session-participant-${participant.id}`;
    const existingCharacter = participant.characterId
      ? (characterById.get(participant.characterId) ?? fetchedCharacterById.get(participant.characterId))
      : undefined;
    uniqueCharacters.set(
      characterId,
      existingCharacter ?? {
        _id: characterId,
        surname: "Participant",
        userId: participant.userId,
      },
    );
  });

  const now = new Date().toISOString();

  return {
    _id: SESSION_PARTICIPANTS_GROUP_ID,
    label: SESSION_PARTICIPANTS_GROUP_LABEL,
    campaignId,
    createdAt: now,
    updatedAt: now,
    characters: Array.from(uniqueCharacters.values()),
  };
};

export function InitBattleDialog({ children }: InitBattleDialogProps) {
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const dispatch = useAppDispatch();
  const selectedCampaignId = useAppSelector(selectSelectedCampaignId);
  const session = useAppSelector(selectCurrentSession);

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAllOpponents, setShowAllOpponents] = React.useState(false);
  const [groups, setGroups] = React.useState<BattleGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = React.useState<string[]>([]);
  const [excludedMembersByGroup, setExcludedMembersByGroup] = React.useState<Record<string, string[]>>({});

  const persistInitBattleDraft = React.useCallback(
    (partial: {
      showAllOpponents?: boolean;
      selectedGroupIds?: string[];
      expandedGroupIds?: string[];
      excludedMembersByGroup?: Record<string, string[]>;
    }) => {
      dispatch(setSessionInitBattleDraft(partial));
    },
    [dispatch],
  );

  const mandatoryGroupIds = React.useMemo(
    () => (groups.some((group) => group._id === SESSION_PARTICIPANTS_GROUP_ID) ? [SESSION_PARTICIPANTS_GROUP_ID] : []),
    [groups],
  );

  const getSanitizedGroupIds = React.useCallback(
    (nextGroupIds: string[]) => {
      return sanitizeGroupIds(nextGroupIds, groups, mandatoryGroupIds);
    },
    [groups, mandatoryGroupIds],
  );

  React.useEffect(() => {
    if (!open || !selectedCampaignId) {
      return;
    }

    let isMounted = true;

    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const allGroups = (await groupService.getAllGroupsByCampaign(selectedCampaignId)) as BattleGroup[];
        if (!isMounted) return;

        const sessionParticipantsGroup = await buildSessionParticipantsGroup(
          allGroups,
          session?.participants ?? [],
          selectedCampaignId,
          session?.code,
        );

        const groupsWithSessionParticipants = [...allGroups, sessionParticipantsGroup];

        const nextMandatoryGroupIds = [SESSION_PARTICIPANTS_GROUP_ID];
        const draft = session?.initBattleDraft;
        const draftSelectedGroupIds = draft?.selectedGroupIds ?? nextMandatoryGroupIds;
        const nextSelectedGroupIds = sanitizeGroupIds(
          draftSelectedGroupIds,
          groupsWithSessionParticipants,
          nextMandatoryGroupIds,
        );
        const draftExpandedGroupIds = draft?.expandedGroupIds ?? nextSelectedGroupIds;
        const nextExpandedGroupIds = Array.from(
          new Set(
            draftExpandedGroupIds
              .filter((groupId) => nextSelectedGroupIds.includes(groupId))
              .concat(nextSelectedGroupIds),
          ),
        );
        const nextExcludedMembersByGroup = Object.fromEntries(
          Object.entries(draft?.excludedMembersByGroup ?? {}).filter(([groupId]) =>
            nextSelectedGroupIds.includes(groupId),
          ),
        );
        const nextShowAllOpponents = draft?.showAllOpponents ?? false;

        setGroups(groupsWithSessionParticipants);
        setSelectedGroupIds(nextSelectedGroupIds);
        setExpandedGroupIds(nextExpandedGroupIds);
        setExcludedMembersByGroup(nextExcludedMembersByGroup);
        setShowAllOpponents(nextShowAllOpponents);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, [open, selectedCampaignId, session?.code, session?.participants]);

  const selectedGroups = React.useMemo(() => {
    const selectedIds = new Set(selectedGroupIds);
    return groups.filter((group) => selectedIds.has(group._id));
  }, [groups, selectedGroupIds]);

  const groupOptions = React.useMemo(() => {
    const uniqueGroups = new Map<string, { label: string; value: string }>();
    groups.forEach((group) => {
      uniqueGroups.set(group._id, {
        label: group.label,
        value: group._id,
      });
    });
    return Array.from(uniqueGroups.values());
  }, [groups]);

  const handleSelectedGroupIdsChange = (nextGroupIds: string[]) => {
    const validGroupIds = getSanitizedGroupIds(nextGroupIds);
    const nextExpandedGroupIds = Array.from(
      new Set(expandedGroupIds.filter((id) => validGroupIds.includes(id)).concat(validGroupIds)),
    );
    const nextExcludedMembersByGroup = Object.fromEntries(
      Object.entries(excludedMembersByGroup).filter(([groupId]) => validGroupIds.includes(groupId)),
    );

    setSelectedGroupIds(validGroupIds);
    setExpandedGroupIds(nextExpandedGroupIds);
    setExcludedMembersByGroup(nextExcludedMembersByGroup);

    persistInitBattleDraft({
      selectedGroupIds: validGroupIds,
      expandedGroupIds: nextExpandedGroupIds,
      excludedMembersByGroup: nextExcludedMembersByGroup,
    });
  };

  const toggleGroupExpanded = (groupId: string) => {
    const nextExpandedGroupIds = expandedGroupIds.includes(groupId)
      ? expandedGroupIds.filter((id) => id !== groupId)
      : [...expandedGroupIds, groupId];

    setExpandedGroupIds(nextExpandedGroupIds);
    persistInitBattleDraft({ expandedGroupIds: nextExpandedGroupIds });
  };

  const toggleGroupSelection = (groupId: string, shouldSelect: boolean) => {
    if (!shouldSelect && mandatoryGroupIds.includes(groupId)) {
      return;
    }

    const nextSelectedGroupIds =
      shouldSelect || mandatoryGroupIds.includes(groupId)
        ? getSanitizedGroupIds(selectedGroupIds.includes(groupId) ? selectedGroupIds : [...selectedGroupIds, groupId])
        : getSanitizedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    const nextExpandedGroupIds = shouldSelect
      ? expandedGroupIds.includes(groupId)
        ? expandedGroupIds
        : [...expandedGroupIds, groupId]
      : expandedGroupIds.filter((id) => id !== groupId);
    const nextExcludedMembersByGroup = shouldSelect
      ? excludedMembersByGroup
      : Object.fromEntries(Object.entries(excludedMembersByGroup).filter(([id]) => id !== groupId));

    setSelectedGroupIds(nextSelectedGroupIds);
    setExpandedGroupIds(nextExpandedGroupIds);
    setExcludedMembersByGroup(nextExcludedMembersByGroup);

    persistInitBattleDraft({
      selectedGroupIds: nextSelectedGroupIds,
      expandedGroupIds: nextExpandedGroupIds,
      excludedMembersByGroup: nextExcludedMembersByGroup,
    });
  };

  const selectAllGroups = () => {
    const nextSelectedGroupIds = groups.map((group) => group._id);
    const nextExpandedGroupIds = Array.from(new Set(expandedGroupIds.concat(nextSelectedGroupIds)));

    setSelectedGroupIds(nextSelectedGroupIds);
    setExpandedGroupIds(nextExpandedGroupIds);

    persistInitBattleDraft({
      selectedGroupIds: nextSelectedGroupIds,
      expandedGroupIds: nextExpandedGroupIds,
    });
  };

  const deselectAllGroups = () => {
    const nextSelectedGroupIds = mandatoryGroupIds;
    const nextExpandedGroupIds = mandatoryGroupIds;
    const nextExcludedMembersByGroup = {};

    setSelectedGroupIds(nextSelectedGroupIds);
    setExpandedGroupIds(nextExpandedGroupIds);
    setExcludedMembersByGroup(nextExcludedMembersByGroup);

    persistInitBattleDraft({
      selectedGroupIds: nextSelectedGroupIds,
      expandedGroupIds: nextExpandedGroupIds,
      excludedMembersByGroup: nextExcludedMembersByGroup,
    });
  };

  const toggleMemberInInitiative = (groupId: string, memberId: string, includeInInitiative: boolean) => {
    const excluded = new Set(excludedMembersByGroup[groupId] ?? []);
    if (includeInInitiative) {
      excluded.delete(memberId);
    } else {
      excluded.add(memberId);
    }

    const nextExcludedMembersByGroup = {
      ...excludedMembersByGroup,
      [groupId]: Array.from(excluded),
    };

    setExcludedMembersByGroup(nextExcludedMembersByGroup);
    persistInitBattleDraft({ excludedMembersByGroup: nextExcludedMembersByGroup });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("initBattleDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
          <Card className="gap-4  p-4 sm:p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("initBattleSelectedGroups")}</p>

              <MultiSelect
                value={selectedGroupIds}
                onChange={handleSelectedGroupIdsChange}
                options={groupOptions}
                placeholder={t("initBattleSearchGroupPlaceholder")}
                searchPlaceholder={t("initBattleSearchGroupPlaceholder")}
                emptyText={t("initBattleNoSearchResult")}
                selectAllLabel={t("initBattleSelectAllGroups")}
                clearLabel={t("initBattleDeselectAllGroups")}
              />
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("initBattleLoadingGroups")}
                </div>
              ) : selectedGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("initBattleNoGroupSelected")}</p>
              ) : (
                <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {selectedGroups.map((group) => {
                    const members = group.characters ?? [];
                    const totalNpcCr = members.reduce((sum, character) => sum + getNpcCr(character), 0);
                    const excludedMembers = new Set(excludedMembersByGroup[group._id] ?? []);
                    const includedCount = members.length - excludedMembers.size;
                    const isExpanded = expandedGroupIds.includes(group._id);

                    return (
                      <Card
                        key={group._id}
                        className="rounded-[24px] bg-gray-middle-light p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroupExpanded(group._id)}
                          className="flex w-full items-start justify-between gap-2 text-left">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{group.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("initBattleGroupStats", {
                                members: members.length,
                                cr: formatCr(totalNpcCr),
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("initBattleIncludedMembers", {
                                included: includedCount,
                                total: members.length,
                              })}
                            </p>
                          </div>
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>

                        {isExpanded && (
                          <div>
                            {members.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t("noCharacters")}</p>
                            ) : (
                              members.map((member) => {
                                const memberIncluded = !excludedMembers.has(member._id);
                                return (
                                  <label
                                    key={member._id}
                                    className="flex flex-col">
                                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                                      <span className="truncate">{formatCharacterName(member)}</span>
                                      <span className="flex shrink-0 items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {t("initBattleInInitiative")}
                                        </span>
                                        <Checkbox
                                          checked={memberIncluded}
                                          onCheckedChange={(checked) =>
                                            toggleMemberInInitiative(group._id, member._id, Boolean(checked))
                                          }
                                        />
                                      </span>
                                    </div>

                                    <Separator className="my-1" />
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className="gap-3 p-4 sm:p-5">
            <p className="text-sm font-semibold">{t("initBattleSettings")}</p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-half-proficiency"
                className="cursor-pointer"
                checked={showAllOpponents}
                onCheckedChange={(checked) => {
                  const nextShowAllOpponents = Boolean(checked);
                  setShowAllOpponents(nextShowAllOpponents);
                  persistInitBattleDraft({ showAllOpponents: nextShowAllOpponents });
                }}
              />
              <Label
                htmlFor="enable-half-proficiency"
                className="cursor-pointer text-sm text-card-foreground">
                {t("initBattleShowAllOpponents")}
              </Label>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button disabled={selectedGroups.length === 0}>{t("initBattleValidateSelection")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
