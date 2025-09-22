"use client";

import { Header } from "@/components/common/Header";
import Loading from "@/components/common/Loading";
import CampaignDetailsPanel from "@/components/modules/campaigns/CampaignDetailsPanel";
import CampaignListPanel from "@/components/modules/campaigns/CampaignListPanel";
import GroupsCampaignsPanel from "@/components/modules/campaigns/GroupsCampaignsPanel";
import useBeforeUnload from "@/hooks/useBeforeUnload";
import { useToast } from "@/hooks/useToast";
import { ICampaign } from "@/models/campaigns/ICampaign";
import { IGroup } from "@/models/groups/IGroup";
import CampaignService from "@/services/campaignService";
import GroupService from "@/services/groupService";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const t = useTranslations("CampaignPage");
  const { error, success } = useToast();

  //Recherche
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  //Update
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  let campaignTempRef = useRef<ICampaign | null>(null);
  let newGroupRef = useRef<any[]>([]);
  let groupsRef = useRef<Map<string, { idCampaign: string; type: "main" | "npc" | "archived" }>>(new Map());
  let groupsLabelRef = useRef<IGroup[]>([]);
  const [updatedGroup, setUpdatedGroup] = useState<IGroup[]>([]);

  const startUpdate = () => {
    if (selectedCampaign) {
      campaignTempRef.current = selectedCampaign;
      setIsUpdating(true);
    }
  };

  const cancelUpdate = async () => {
    if (selectedCampaign) {
      setLoading(true);
      await setSelectedCampaign(campaignTempRef.current);
      campaignTempRef.current = null;
      groupsLabelRef.current = [];
      groupsRef.current = new Map();
      newGroupRef.current = [];
      setIsUpdating(false);
      setLoading(false);
      setUpdatedGroup([]);
      success(t("toasts.cancel"));
    }
  };

  const saveActions = async () => {
    if (selectedCampaign) {
      setLoading(true);
      await Promise.all(
        groupsLabelRef.current
          .filter((group) => !(typeof group._id === "string" && group._id.startsWith("temp-")))
          .map(async (group) => {
            const label = group.label?.trim() || t("form.newGroup");
            const matchingGroup = newGroupRef.current.find((g) => g._id === group._id);
            if (matchingGroup) {
              matchingGroup.label = label;
            }
            if (typeof group._id === "string" && !group._id.startsWith("temp-") && !group._id.startsWith("new-")) {
              await GroupService.updateGroup(group._id, { label });
            } else {
              newGroupRef.current.forEach((newGroup) => {
                if (newGroup._id === group._id) {
                  newGroup.label = label;
                }
              });
            }
          }),
      );

      await Promise.all(
        newGroupRef.current
          .filter(
            (group) => typeof group._id === "string" && (group._id.startsWith("temp-") || group._id.startsWith("new-")),
          )
          .map(async (group) => {
            const label = group.label?.trim()?.length ? group.label.trim() : t("form.newGroup");
            const { _id, label: _, ...rest } = group;
            await GroupService.createGroup({ ...rest, label });
          }),
      );

      await Promise.all(
        updatedGroup
          .filter((group) => !(typeof group._id === "string" && group._id.startsWith("temp-")))
          .map(async (group) => {
            if (typeof group._id === "string") {
              await GroupService.updateGroup(group._id, { campaigns: group.campaigns });
            }
          }),
      );

      updateCampaign(selectedCampaign);

      newGroupRef.current = [];
      groupsLabelRef.current = [];
      groupsRef.current = new Map();

      setUpdatedGroup([]);
      setLoading(false);

      success(t("toasts.save"));
    }
  };

  const updateCampaign = useCallback(async (updateCampaign: Partial<ICampaign>) => {
    try {
      if (!updateCampaign._id) return;
      const { groups, ...campaigns } = updateCampaign;
      let response = await CampaignService.updateCampaign(updateCampaign._id, campaigns);

      let data = response.data;
      response.data.groups = {
        archived: data.groups.archived.map((group: { _id: any }) => group._id),
        npc: data.groups.npc.map((group: { _id: any }) => group._id),
        main: data.groups.main.map((group: { _id: any }) => group._id),
      };

      setSelectedCampaign(data as ICampaign);
    } catch (err) {
      error(t("toasts.errorUpdatingCampaign"));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (deletedCampaign: ICampaign) => {
    try {
      await CampaignService.deleteCampaign(deletedCampaign._id);
      setSelectedCampaign((prev) => {
        if (prev) {
          return {
            ...prev,
            deletedAt: new Date(),
          };
        }
        return prev;
      });
      success(t("toasts.deletedCampaign"));
    } catch (err) {
      error(t("toasts.errorDetetingCampaign"));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey && isUpdating) {
        setTimeout(() => {
          saveActions();
        }, 100);
        return;
      }

      if (event.key === "Escape" && isUpdating) {
        cancelUpdate();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUpdating, selectedCampaign]);

  useBeforeUnload(isUpdating, t("form.unsave"));

  return (
    <div className="h-[91dvh] w-full flex flex-col">
      <Header campaign={selectedCampaign} />
      <main className="h-full flex flex-row">
        <div className="h-[87dvh] w-1/4">
          <CampaignListPanel
            search={search}
            setSearch={setSearch}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={setSelectedCampaign}
          />
        </div>
        <div className="h-[90vh] justify-center flex flex-col">
          <div className="h-[80vh] border border-ring"></div>
        </div>
        <div className="w-full">
          <div className="w-full h-[90%] flex flex-row justify-center items-center">
            {loading && <Loading />}
            {!loading && selectedCampaign && (
              <div className="flex flex-col justify-start items-center w-full h-full">
                <div className="w-full flex flex-col ">
                  <CampaignDetailsPanel
                    campaign={selectedCampaign}
                    setCampaign={setSelectedCampaign}
                    onDelete={deleteCampaign}
                    isUpdating={isUpdating}
                    startUpdate={startUpdate}
                    cancelUpdate={cancelUpdate}
                    saveActions={saveActions}
                  />
                </div>
                <div className="w-[90vh] flex flex-col">
                  <div className="w-[80vh] border border-ring"></div>
                </div>
                <div className="w-full h-[68dvh] flex flex-row items-center p-5">
                  <GroupsCampaignsPanel
                    setUpdatedGroup={setUpdatedGroup}
                    updatedGroup={updatedGroup}
                    idCampaign={selectedCampaign._id}
                    isUpdating={isUpdating}
                    groupsRef={groupsRef}
                    newGroupRef={newGroupRef}
                    groupsLabelRef={groupsLabelRef}
                  />
                </div>
              </div>
            )}
            {!loading && !selectedCampaign && (
              <div className="flex flex-col gap-10 justify-center items-center h-full">
                <span className="w-full">{t("tutorial.step1")}</span>
                <span className="w-full">{t("tutorial.step2")}</span>
                <span className="w-full">{t("tutorial.step3")}</span>
                <span className="w-full">{t("tutorial.step4")}</span>
                <span className="w-full">{t("tutorial.step5")}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
