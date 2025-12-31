"use client";
import Loading from "@/components/common/Loading";
import CreateCampaign from "@/components/modals/CreateCampaign";
import SearchInput from "@/components/common/SearchBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { useToast } from "@/hooks/useToast";
import { ICampaign } from "@/models/campaigns/ICampaign";
import CampaignService from "@/services/campaignService";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useKeycloak } from "@/providers/KeycloakProvider";

interface Props {
  offset?: number;
  selectedCampaign: ICampaign | null;
  setSelectedCampaign: (campaign: ICampaign | null) => void;
  addable?: boolean;
  search: string;
  setSearch: (search: string) => void;
}

const CampaignListPanel = ({
  offset = 16,
  selectedCampaign,
  setSelectedCampaign,
  addable = true,
  search,
  setSearch,
}: Props) => {
  const currentLocale = useLocale();
  const t = useTranslations("CampaignListPanel");
  const { authenticated, loading: authLoading } = useKeycloak();

  const { error, success } = useToast();

  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);

  //Pagination
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  //Ref pour le scroll infini
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null); //Ref pour mesurer la hauteur des cards
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);

  const fetchCampaigns = useCallback(
    async (search: string, nextPage = 1, reset = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const response = await CampaignService.getAllCampaigns({
          page: nextPage,
          offset,
          label: search, // Removed encodeURIComponent - axios handles it
        });
        if (response.statusCode === 401) {
          return;
        }

        // Extract data and pagination from API response
        const campaignsData = response.data || [];
        const totalItems = response.pagination?.totalItems || 0;

        if (reset) {
          setCampaigns(campaignsData);
          setSelectedCampaign(campaignsData[0] || null);
          // After reset, check if there are more items
          setHasMore(campaignsData.length < totalItems);
        } else {
          setCampaigns((prev) => {
            const newCampaigns = [...prev, ...campaignsData];
            // Check if we've loaded all items
            setHasMore(newCampaigns.length < totalItems);
            return newCampaigns;
          });
        }
        setPage(nextPage);
      } catch (err) {
        error(t("error"));
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading, selectedCampaign?.deletedAt],
  );

  useInfiniteScroll(sentinelRef, fetchCampaigns, page, loading, search, hasMore);

  //Mesurer la hauteur des cards
  useEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est authentifié
    if (!authLoading && authenticated) {
      setCampaigns([]);
      fetchCampaigns(search, 1, true);
    }
  }, [currentLocale, search, selectedCampaign?.deletedAt, authenticated, authLoading]);

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  const createCampaign = useCallback(async (label: string) => {
    try {
      const response = await CampaignService.createCampaign({
        label,
        description: "",
        groups: { main: [], npc: [], archived: [] },
      });
      fetchCampaigns(search, 1, true);
      success(t("created"));
    } catch (err) {
      error(t("error"));
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      {createModalOpen && (
        <CreateCampaign
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onConfirm={createCampaign}
        />
      )}

      <CardHeader className="flex-none h-auto items-center gap-3">
        <CardTitle className="text-foreground font-bold">{t("title")}</CardTitle>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("search")}
        />
        {addable && (
          <Card
            onClick={() => setCreateModalOpen(true)}
            ref={cardRef}
            className="w-full bg-primary justify-center flex p-2 gap-3 border-ring hover:shadow-[inset_0_0_0_1px_hsl(var(--ring))] hover:border-primary cursor-pointer shadow-md">
            <span className="text-background font-bold">{t("create")}</span>
          </Card>
        )}
      </CardHeader>
      <CardContent
        ref={containerRef}
        className="flex-1 h-full overflow-auto scrollbar-hide">
        <div className="flex flex-col gap-3">
          {loading && <Loading />}
          {campaigns &&
            campaigns.length > 0 &&
            campaigns.map((campaign) => (
              <Card
                key={campaign._id}
                className={`flex p-2 gap-3 border-ring shadow-md hover:shadow-[inset_0_0_0_1px_hsl(var(--ring))] cursor-pointer bg-background ${selectedCampaign?._id === campaign._id ? "shadow-[inset_0_0_0_1px_hsl(var(--ring))]" : "border"
                  }`}
                onClick={() => setSelectedCampaign(campaign)}>
                <span className="text-foreground font-bold">{campaign.label}</span>
              </Card>
            ))}
          {campaigns && campaigns.length === 0 && !loading && (
            <div className="row-start-2 col-span-3 flex items-top justify-center">
              <p className="text-gray-500">{t("noCampaigns")}</p>
            </div>
          )}
        </div>
        {campaigns.length >= offset && (
          <div
            ref={sentinelRef}
            className="h-1"
          />
        )}
      </CardContent>
    </div>
  );
};

export default CampaignListPanel;
