"use client";
import { Header } from "@/components/common/Header";
import Loading from "@/components/common/Loading";
import { ICampaign } from "@/models/campaigns/ICampaign";
import CampaignService from "@/services/campaignService";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

const BattleLayout = ({ children }: Props) => {
  const { campaignId } = useParams();

  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    const fetchCampaign = async () => {
      const res = await CampaignService.findOne(campaignId?.toString());
      if (res) {
        setCampaign(res.data);
      }
    };

    fetchCampaign();

    setLoading(false);
  }, [campaignId]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Header
        campaign={campaign}
        battle
      />
      {children}
    </div>
  );
};

export default BattleLayout;
