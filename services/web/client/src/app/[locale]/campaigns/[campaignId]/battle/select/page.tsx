"use client";
import GroupSelector from "@/components/modules/battle/GroupSelector";
import { Button } from "@/components/ui/button";
import { IGroup, IGroupWithRelations } from "@/models/groups/IGroup";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const BattleSelectionPage = () => {
  const { campaignId } = useParams();
  const t = useTranslations("GroupSelectorPage");

  const [groupsLeft, setGroupsLeft] = useState<IGroup[]>([]);
  const [groupsRight, setGroupsRight] = useState<IGroup[]>([]);
  const [fightingGroups, setFightingGroups] = useState<(IGroupWithRelations | null)[]>([null, null]);

  return (
    <div className="mt-12 flex flex-col w-full gap-4 items-center">
      <h1 className="text-2xl ">{t("title")}</h1>
      <div className="flex flex-row items-center justify-around w-1/2">
        <GroupSelector
          campaignId={campaignId as string}
          groupsLeft={groupsLeft as IGroup[]}
          setGroupsLeft={setGroupsLeft}
          groupsRight={groupsRight as IGroup[]}
          setGroupsRight={setGroupsRight}
          groupsToFight={fightingGroups}
          setGroupsToFight={setFightingGroups}
        />
      </div>
      {fightingGroups[0] && fightingGroups[1] && (
        <div className="flex justify-end p-5">
          <Link href={`/campaigns/${campaignId}/battle/${fightingGroups[0]?._id}/${fightingGroups[1]?._id}`}>
            <Button className="text-xl h-12 px-8">{t("battle")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default BattleSelectionPage;
