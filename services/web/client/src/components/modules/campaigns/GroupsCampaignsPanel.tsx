"use client";

import { useTranslations } from "next-intl";
import GroupListPanel from "@/components/modules/groups/GroupListPanel";
import { IGroup } from "@/models/groups/IGroup";
import { RefObject, useCallback, useEffect, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import GroupDnDWrapper from "@/components/modules/groups/GroupDndProvider";
import { ICampaign } from "@/models/campaigns/ICampaign";
import { useToast } from "@/hooks/useToast";
import { MousePointerClick } from "lucide-react";
import Link from "next/link";

interface Props {
  idCampaign: string; // ID de la campagne des groupes
  isUpdating: boolean; // Indique si la campagne est en cours de mise à jour
  groupsRef: RefObject<Map<string, { idCampaign: string; type: "main" | "npc" | "archived" }>>; // Liste des groupes
  newGroupRef: RefObject<any[]>; // Liste des nouveaux groupes
  groupsLabelRef: RefObject<IGroup[]>; // Liste des groupes à ne pas afficher
  setUpdatedGroup: React.Dispatch<React.SetStateAction<IGroup[]>>; // Setter de la liste des groupes
  updatedGroup: IGroup[]; // Liste des groupes à ne pas afficher
}
export default function GroupsCampaignsPanel({
  idCampaign,
  isUpdating,
  groupsRef,
  newGroupRef,
  groupsLabelRef,
  setUpdatedGroup,
  updatedGroup,
}: Props) {
  const t = useTranslations("GroupListPanel");
  const { error } = useToast();

  const [mainGroups, setMainGroups] = useState<IGroup[]>([]);
  const [npcGroups, setNpcGroups] = useState<IGroup[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<IGroup[]>([]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !["main", "npc", "archived"].includes(over.id as string)) return;

    const group: IGroup = active.data.current?.group;
    const from = active.data.current?.from;
    const to = over.id as "main" | "npc" | "archived";

    if (from === to) return;

    const updatedCampaigns = group.campaigns.map((campaign: ICampaign | string) => {
      const campaignId = typeof campaign === "string" ? campaign : campaign._id;
      if (campaignId !== idCampaign) return campaign;
      return { idCampaign: campaignId, type: to };
    });

    groupsRef.current.set(group._id, {
      idCampaign: idCampaign,
      type: to,
    });
    group.campaigns = updatedCampaigns as any;

    //Chnage groupe si il existe dans newGroupRef
    if (newGroupRef.current.find((g) => g._id === group._id)) {
      newGroupRef.current = newGroupRef.current.map((g) => {
        if (g._id === group._id) {
          const t = {
            ...g,
            campaigns: [
              {
                idCampaign: idCampaign,
                type: to,
              },
            ],
          };
          return t;
        }
        return g;
      });
    }

    const groupSetters = {
      main: setMainGroups,
      npc: setNpcGroups,
      archived: setArchivedGroups,
    };

    Object.entries(groupSetters).forEach(([key, setter]) => {
      if (from === key) setter((prev) => prev.filter((g) => g._id !== group._id));
    });

    setUpdatedGroup([...updatedGroup, group]);
    groupSetters[to]((prev) => [...prev, group]);
  };

  const createGroup = useCallback(async (type: "main" | "npc" | "archived") => {
    try {
      let current = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        label: "",
        description: "",
        campaigns: [{ idCampaign: idCampaign, type }],
      };
      newGroupRef.current.push(current);
      setUpdatedGroup([...updatedGroup, current as unknown as IGroup]);
      switch (type) {
        case "main":
          setMainGroups((prev) => [...prev, current as unknown as IGroup]);
          break;
        case "npc":
          setNpcGroups((prev) => [...prev, current as unknown as IGroup]);
          break;
        case "archived":
          setArchivedGroups((prev) => [...prev, current as unknown as IGroup]);
          break;
      }
    } catch (err) {
      error(t("error"));
    }
  }, []);

  const [mainSearch, setMainSearch] = useState<string>("");
  const [npcSearch, setNpcSearch] = useState<string>("");
  const [archivedSearch, setArchivedSearch] = useState<string>("");

  const changeLabel = (label: string, group: IGroup) => {
    if (groupsLabelRef.current.find((g) => g._id === group._id)) {
      groupsLabelRef.current = groupsLabelRef.current.map((g) => {
        if (g._id === group._id) {
          return { ...g, label };
        }
        return g;
      });
      newGroupRef.current = newGroupRef.current.map((g) => {
        if (g._id === group._id) {
          return { ...g, label };
        }
        return g;
      });
      setUpdatedGroup([...updatedGroup, group]);
    } else {
      groupsLabelRef.current.push({ ...group, label });
    }
    setMainGroups((prev) => prev.map((g) => (g._id === group._id ? { ...g, label } : g)));
    setNpcGroups((prev) => prev.map((g) => (g._id === group._id ? { ...g, label } : g)));
    setArchivedGroups((prev) => prev.map((g) => (g._id === group._id ? { ...g, label } : g)));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Link
        href={`/campaigns/${idCampaign}/groups`}
        className="text-foreground hover:underline underline-offset-2">
        <h2 className="flex gap-1 items-center">
          <MousePointerClick className="h-[2dvh]" /> {t("title.default")}
        </h2>
      </Link>
      <div className="flex flex-row gap-10 mt-4 justify-between h-full">
        <GroupDnDWrapper onDragEnd={handleDragEnd}>
          <div className="rounded-xl border border-ring bg-card text-card-foreground shadow-sm w-1/3 h-full">
            <GroupListPanel
              displayMembersCount
              updatedGroup={updatedGroup}
              changeLabel={changeLabel}
              groups={mainGroups}
              setGroups={setMainGroups}
              reverse={true}
              grabbled={isUpdating}
              idCampaign={idCampaign}
              addable={isUpdating}
              onAdd={() => createGroup("main")}
              type="main"
              search={mainSearch}
              setSearch={setMainSearch}
            />
          </div>
          <div className="rounded-xl border border-ring bg-card text-card-foreground shadow-sm w-1/3 h-full">
            <GroupListPanel
              displayMembersCount
              updatedGroup={updatedGroup}
              changeLabel={changeLabel}
              groups={npcGroups}
              setGroups={setNpcGroups}
              reverse={true}
              grabbled={isUpdating}
              idCampaign={idCampaign}
              addable={isUpdating}
              onAdd={() => createGroup("npc")}
              type="npc"
              search={npcSearch}
              setSearch={setNpcSearch}
            />
          </div>
          <div className="rounded-xl border border-ring bg-card text-card-foreground shadow-sm w-1/3 h-full">
            <GroupListPanel
              displayMembersCount
              updatedGroup={updatedGroup}
              changeLabel={changeLabel}
              groups={archivedGroups}
              setGroups={setArchivedGroups}
              reverse={true}
              grabbled={isUpdating}
              idCampaign={idCampaign}
              addable={isUpdating}
              onAdd={() => createGroup("archived")}
              type="archived"
              search={archivedSearch}
              setSearch={setArchivedSearch}
            />
          </div>
        </GroupDnDWrapper>
      </div>
    </div>
  );
}
