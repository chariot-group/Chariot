"use client";
import Loading from "@/components/common/Loading";
import InitiativeTracker from "@/components/modules/battle/InitiativeTracker";
import { Button } from "@/components/ui/button";
import { IGroupWithRelations } from "@/models/groups/IGroup";
import GroupService from "@/services/groupService";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const BattlePage = () => {
  const { campaignId, firstGroupId, secondGroupId } = useParams();

  const t = useTranslations("BattlePage");

  const [groupsToFight, setGroupsToFight] = useState<(IGroupWithRelations | null)[]>([null, null]);

  const getStringParam = (param: string | string[] | undefined): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  const fetchGroups = async () => {
    const firstId = getStringParam(firstGroupId);
    const secondId = getStringParam(secondGroupId);
    if (!firstId || !secondId) return;

    const res1 = await GroupService.findOne(firstId);
    const res2 = await GroupService.findOne(secondId);

    if (res1 && res2) {
      setGroupsToFight([res1.data, res2.data]);
    }
  };

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    fetchGroups();
  }, [campaignId, firstGroupId, secondGroupId]);

  if (!groupsToFight[0] || !groupsToFight[1]) {
    return <Loading />;
  }

  return (
    <InitiativeTracker
      groups={groupsToFight as IGroupWithRelations[]}
      campaignId={campaignId as string}
    />
  );
};

export default BattlePage;
