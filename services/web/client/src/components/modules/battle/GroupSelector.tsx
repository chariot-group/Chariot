import React from "react";
import GroupListPanel from "@/components/modules/groups/GroupListPanel";
import { IGroup, IGroupWithRelations } from "@/models/groups/IGroup";
import GroupService from "@/services/groupService";
import { useTranslations } from "next-intl";

interface Props {
  campaignId: string; // ID de la campagne
  groupsLeft: IGroup[]; // Liste des groupes à afficher
  setGroupsLeft: React.Dispatch<React.SetStateAction<IGroup[]>>; // Setter de la liste des groupes
  groupsRight: IGroup[]; // Liste des groupes à afficher
  setGroupsRight: React.Dispatch<React.SetStateAction<IGroup[]>>; // Setter de la liste des groupes
  groupsToFight: (IGroupWithRelations | null)[]; // Liste des groupes à afficher
  setGroupsToFight: React.Dispatch<React.SetStateAction<(IGroupWithRelations | null)[]>>; // Setter de la liste des groupes
}

const GroupSelector = ({
  campaignId,
  groupsLeft,
  setGroupsLeft,
  groupsRight,
  setGroupsRight,
  groupsToFight,
  setGroupsToFight,
}: Props) => {
  const t = useTranslations("GroupSelector");

  const [searchLeft, setSearchLeft] = React.useState<string>("");
  const [searchRight, setSearchRight] = React.useState<string>("");
  const handleGroupSelected = async (group: IGroup | null, index: 0 | 1) => {
    // Ne rien faire si l'autre groupe sélectionné a le même _id
    const otherIndex = index === 0 ? 1 : 0;
    const otherGroup = groupsToFight[otherIndex];
    if (group?._id && group._id === otherGroup?._id) return;

    const res = await GroupService.findOne(group?._id || "");
    if (res) {
      const groupWithRelations = res.data;
      setGroupsToFight((prev) => {
        const newGroups = [...prev];
        newGroups[index] = groupWithRelations;
        return newGroups;
      });
    }
  };

  return (
    <div className="flex flex-row items-center justify-center gap-4 w-full">
      <div className="w-full h-[50vh]">
        <GroupListPanel
          offset={10}
          displayMembersCount={true}
          onlyWithMembers={true}
          updatedGroup={[]}
          addable={false}
          context
          search={searchLeft}
          setSearch={setSearchLeft}
          groups={groupsLeft}
          setGroups={setGroupsLeft}
          groupSelected={
            groupsToFight[0]
              ? {
                ...groupsToFight[0],
                characters: groupsToFight[0].characters.map((c) => c._id),
                campaigns: groupsToFight[0].campaigns.map((c) => c._id),
              }
              : null
          }
          setGroupSelected={(group) => handleGroupSelected(group, 0)}
          idCampaign={campaignId}
          disabledGroups={
            groupsToFight[1]
              ? [
                {
                  ...groupsToFight[1],
                  characters: groupsToFight[1].characters.map((c) => c._id),
                  campaigns: groupsToFight[1].campaigns.map((c) => c._id),
                },
              ]
              : []
          }
        />
      </div>
      <p className="text-4xl">{t("versus")}</p>
      <div className="w-full h-[50vh]">
        <GroupListPanel
          offset={10}
          displayMembersCount={true}
          onlyWithMembers={true}
          updatedGroup={[]}
          addable={false}
          context
          search={searchRight}
          setSearch={setSearchRight}
          groups={groupsRight}
          setGroups={setGroupsRight}
          groupSelected={
            groupsToFight[1]
              ? {
                ...groupsToFight[1],
                characters: groupsToFight[1].characters.map((c) => c._id),
                campaigns: groupsToFight[1].campaigns.map((c) => c._id),
              }
              : null
          }
          setGroupSelected={(group) => handleGroupSelected(group, 1)}
          idCampaign={campaignId}
          disabledGroups={
            groupsToFight[0]
              ? [
                {
                  ...groupsToFight[0],
                  characters: groupsToFight[0].characters.map((c) => c._id),
                  campaigns: groupsToFight[0].campaigns.map((c) => c._id),
                },
              ]
              : []
          }
        />
      </div>
    </div>
  );
};

export default GroupSelector;
