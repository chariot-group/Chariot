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
import { MultiSelect } from "@/components/ui/multi-select";
import groupService from "@/services/GroupService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSelectedCampaignId } from "@/store/slices/campaignContextSlice";
import { selectCurrentSession, setSessionInitBattleDraft } from "@/store/slices/sessionSlice";
import { Group } from "@/types/campaign";
import { ChevronDown, ChevronRight, Loader2, Skull, Star, Swords, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SessionParticipant } from "@/services/SessionService";
import characterService from "@/services/CharacterService";
import { Player } from "@/types/character";

type BattleGroupCharacter = {
  _id: string;
  firstname?: string;
  lastname?: string;
  surname?: string;
  createdBy?: string;
  challenge?: {
    challengeRating?: number | string;
  };
  profile?: {
    type?: string;
  };
  progression?: {
    level?: number;
  };
};

type BattleGroup = Omit<Group, "characters"> & {
  characters: BattleGroupCharacter[];
};

const SESSION_PARTICIPANTS_GROUP_ID = "__session_participants__";
const SESSION_PARTICIPANTS_GROUP_LABEL = "Participants session";

const sanitizeGroupIds = (nextGroupIds: string[], allGroups: BattleGroup[], mandatoryIds: string[]): string[] => {
  const validGroupIds = new Set(
    allGroups.filter((group) => (group.characters ?? []).length > 0).map((group) => group._id),
  );
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

const isNpcCharacter = (character: BattleGroupCharacter): boolean => {
  const cr = parseChallengeRating(character.challenge?.challengeRating);
  return cr > 0 || !character.createdBy || !!character.profile?.type;
};

const getNpcCr = (character: BattleGroupCharacter): number => {
  if (!isNpcCharacter(character)) return 0;
  return parseChallengeRating(character.challenge?.challengeRating);
};

const getPlayerLevel = (character: BattleGroupCharacter): number => {
  if (isNpcCharacter(character)) return 0;
  const level = character.progression?.level;
  return typeof level === "number" && Number.isFinite(level) && level > 0 ? level : 0;
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
      createdBy: character.createdBy,
      progression: (character as Player).progression,
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
        createdBy: participant.userId,
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
  const t = useTranslations("initTracker");
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
        const allGroups = (await groupService.getAllGroupsByCampaign(selectedCampaignId, "active")) as BattleGroup[];
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
        const draftExpandedGroupIds = draft?.expandedGroupIds ?? [];
        const nextExpandedGroupIds = Array.from(
          new Set(draftExpandedGroupIds.filter((groupId) => nextSelectedGroupIds.includes(groupId))),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initBattleDraft is only read once on open to restore draft state; including it would retrigger loadGroups on every user interaction
  }, [open, selectedCampaignId, session?.code, session?.participants]);

  const selectedGroups = React.useMemo(() => {
    const selectedIds = new Set(selectedGroupIds);
    return groups.filter((group) => selectedIds.has(group._id));
  }, [groups, selectedGroupIds]);

  const canValidate = React.useMemo(() => {
    const nonParticipantGroups = selectedGroups.filter((g) => g._id !== SESSION_PARTICIPANTS_GROUP_ID);
    if (nonParticipantGroups.length === 0) return false;
    return selectedGroups.every((group) => {
      const members = group.characters ?? [];
      const excluded = new Set(excludedMembersByGroup[group._id] ?? []);
      return members.length - excluded.size > 0;
    });
  }, [selectedGroups, excludedMembersByGroup]);

  const groupOptions = React.useMemo(() => {
    const uniqueGroups = new Map<string, { label: string; value: string; description?: React.ReactNode }>();
    groups.forEach((group) => {
      const members = group.characters ?? [];
      if (members.length === 0) return;
      const npcMembers = members.filter(isNpcCharacter);
      const playerMembers = members.filter((c) => !isNpcCharacter(c));
      const totalNpcCr = npcMembers.length > 0 ? npcMembers.reduce((sum, c) => sum + getNpcCr(c), 0) : 0;
      const avgPlayerLevel =
        playerMembers.length > 0
          ? playerMembers.reduce((sum, c) => sum + getPlayerLevel(c), 0) / playerMembers.length
          : 0;
      uniqueGroups.set(group._id, {
        label: group.label,
        value: group._id,
        description: (
          <span className="flex flex-wrap gap-x-2 gap-y-0.5">
            <span className="flex items-center gap-1">
              <Users className="size-3 shrink-0 text-foreground/50" />
              {t("initBattleGroupStats", { members: members.length })}
            </span>
            {npcMembers.length > 0 && (
              <span className="flex items-center gap-1">
                <Skull className="size-3 shrink-0 text-red-400" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <abbr className="no-underline cursor-help">{t("initBattleNpcCrLabel")}</abbr>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tCommon("challengeRatingTooltip")}</p>
                  </TooltipContent>
                </Tooltip>{" "}
                {t("initBattleNpcTotalCr", { cr: formatCr(totalNpcCr) })}
              </span>
            )}
            {playerMembers.length > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-3 shrink-0 text-yellow-400" />
                {t("initBattlePlayerAvgLevel", { level: formatCr(avgPlayerLevel) })}
              </span>
            )}
          </span>
        ),
      });
    });
    return Array.from(uniqueGroups.values());
  }, [groups, t, tCommon]);

  const handleSelectedGroupIdsChange = (nextGroupIds: string[]) => {
    const validGroupIds = getSanitizedGroupIds(nextGroupIds);
    const nextExpandedGroupIds = expandedGroupIds.filter((id) => validGroupIds.includes(id));
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
      <DialogContent className="sm:max-w-4xl h-[85vh] !flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("initBattleDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid gap-4 grid-cols-1 items-start h-full">
            <Card className="gap-4 p-4 sm:p-5 h-full bg-transparent !flex !flex-col">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p className="text-sm font-semibold">{t("initBattleSelectedGroups")}</p>
                  <div className="flex shrink-0 items-center gap-2">
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
                </div>

                <MultiSelect
                  value={selectedGroupIds}
                  onChange={handleSelectedGroupIdsChange}
                  options={groupOptions}
                  placeholder={t("initBattleSearchGroupPlaceholder")}
                  searchPlaceholder={t("initBattleSearchGroupPlaceholder")}
                  emptyText={t("initBattleNoSearchResult")}
                  selectAllLabel={t("initBattleSelectAllGroups")}
                  disabledValues={mandatoryGroupIds}
                  disabledTooltip={t("initBattleParticipantsCannotBeExcluded")}
                />
              </div>

              <div className="space-y-2 h-full">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("initBattleLoadingGroups")}
                  </div>
                ) : selectedGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("initBattleNoGroupSelected")}</p>
                ) : (
                  <div className="max-h-[40vh] sm:max-h-[55vh] space-y-2 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {selectedGroups.map((group) => {
                      const members = group.characters ?? [];
                      const npcMembers = members.filter(isNpcCharacter);
                      const playerMembers = members.filter((c) => !isNpcCharacter(c));
                      const totalNpcCr =
                        npcMembers.length > 0 ? npcMembers.reduce((sum, c) => sum + getNpcCr(c), 0) : 0;
                      const avgPlayerLevel =
                        playerMembers.length > 0
                          ? playerMembers.reduce((sum, c) => sum + getPlayerLevel(c), 0) / playerMembers.length
                          : 0;
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
                            className="flex w-full items-start justify-between gap-2 text-left hover:cursor-pointer">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{group.label}</p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                <span className="flex items-center gap-1 text-xs text-foreground/70">
                                  <Users className="size-3 shrink-0 text-foreground/50" />
                                  {t("initBattleGroupStats", { members: members.length })}
                                </span>
                                {npcMembers.length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-foreground/70">
                                    <Skull className="size-3 shrink-0 text-red-400" />
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <abbr className="no-underline cursor-help">{t("initBattleNpcCrLabel")}</abbr>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{tCommon("challengeRatingTooltip")}</p>
                                      </TooltipContent>
                                    </Tooltip>{" "}
                                    {t("initBattleNpcTotalCr", { cr: formatCr(totalNpcCr) })}
                                  </span>
                                )}
                                {playerMembers.length > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-foreground/70">
                                    <Star className="size-3 shrink-0 text-yellow-400" />
                                    {t("initBattlePlayerAvgLevel", { level: formatCr(avgPlayerLevel) })}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
                                  <Swords className="size-3 shrink-0 text-blue-400" />
                                  {t("initBattleIncludedMembers", {
                                    included: includedCount,
                                    total: members.length,
                                  })}
                                </span>
                              </div>
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
                                      className="flex flex-col cursor-pointer">
                                      <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                                        <span className="truncate">
                                          {formatCharacterName(member)}
                                          {isNpcCharacter(member) && getNpcCr(member) > 0 && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                              (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <abbr className="no-underline cursor-help">
                                                    {t("initBattleNpcCrLabel")}
                                                  </abbr>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>{tCommon("challengeRatingTooltip")}</p>
                                                </TooltipContent>
                                              </Tooltip>{" "}
                                              {formatCr(getNpcCr(member))})
                                            </span>
                                          )}
                                          {!isNpcCharacter(member) && getPlayerLevel(member) > 0 && (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                              (niv. {getPlayerLevel(member)})
                                            </span>
                                          )}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            {t("initBattleInInitiative")}
                                          </span>
                                          <Checkbox
                                            checked={memberIncluded}
                                            className="cursor-pointer"
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
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button disabled={!canValidate}>{t("initBattleValidateSelection")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
