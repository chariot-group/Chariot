"use client";

import { useCallback } from "react";
import { Ban, Clock, Coins, Ghost, Landmark, Sprout } from "lucide-react";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PeriodControls } from "@/components/kpi/PeriodControls";
import { useBusinessPeriodLoader } from "@/hooks/useBusinessPeriodLoader";
import { fetchAdventureBusiness, fetchSessionBusiness } from "@/services/BusinessAnalyticsService";
import { deadCampaignCount, formatKpiCount, formatRate, spentGiftNeverBoughtCount, topShare } from "@/lib/businessFunnel";
import { KPI_INFO } from "@/lib/businessKpiCopy";
import type { AdventureBusinessAnalytics, Period, SessionBusinessAnalytics } from "@/lib/businessKpis.types";

type AdventurePageData = {
  adventure: AdventureBusinessAnalytics | null;
  session: SessionBusinessAnalytics | null;
  failed: string[];
};

async function loadAdventurePage(range: { period: Period; from: string; to: string }): Promise<AdventurePageData> {
  const [adventure, session] = await Promise.allSettled([
    fetchAdventureBusiness(range),
    fetchSessionBusiness(range),
  ]);
  const failed: string[] = [];
  if (adventure.status === "rejected") failed.push("Adventure");
  if (session.status === "rejected") failed.push("Session");
  return {
    adventure: adventure.status === "fulfilled" ? adventure.value : null,
    session: session.status === "fulfilled" ? session.value : null,
    failed,
  };
}

export default function AdventureKpiPage() {
  const loader = useBusinessPeriodLoader(
    loadAdventurePage,
    "business-adventure-load-error",
    "Erreur lors du chargement des KPI Adventure",
  );
  const onPreset = useCallback((index: number) => loader.setPreset(index), [loader]);
  const adventure = loader.data?.adventure;
  const session = loader.data?.session;
  const dead = adventure && session
    ? deadCampaignCount(adventure.content.campaignIdsCreated, session.launchedCampaignIds)
    : null;
  const concentration = session ? topShare(session.gmTableCounts.map((row) => row.count)) : null;

  return (
    <div className="space-y-6">
      <PeriodControls
        preset={loader.preset}
        period={loader.period}
        loading={loader.loading}
        onPreset={onPreset}
        onPeriod={loader.setPeriod}
        onRefresh={loader.load}
      />
      {loader.data?.failed.length ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Impossible de charger : {loader.data.failed.join(", ")}.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Stock de wheels"
          value={adventure ? String(adventure.economy.wheelsInCirculation) : "—"}
          icon={Coins}
          sub={
            adventure
              ? `Vendues ${adventure.economy.wheelsSold} · Dépensées ${adventure.economy.wheelsSpent}`
              : "Économie inflationniste si le stock explose"
          }
          info={KPI_INFO.wheelsCirculation}
          color="text-(--green)"
        />
        <KpiCard
          title="Gift jamais utilisé"
          value={formatKpiCount(adventure?.economy.unusedGiftUsers)}
          icon={Sprout}
          sub="Toujours à 1 wheel, aucune dépense"
          info={KPI_INFO.unusedGift}
        />
        <KpiCard
          title="Gift consommé, sans achat"
          value={adventure ? formatKpiCount(spentGiftNeverBoughtCount(adventure.economy)) : "—"}
          icon={Ban}
          sub="Solde 0, jamais de boutique"
          info={KPI_INFO.spentGiftNeverBought}
          color="text-(--yellow)"
        />
        <KpiCard
          title="Délai → 1er PJ"
          value={
            adventure?.content.medianHoursToFirstPlayer != null
              ? `${adventure.content.medianHoursToFirstPlayer} h`
              : "—"
          }
          icon={Clock}
          sub="Médiane depuis la création du compte"
          info={KPI_INFO.delayFirstPlayer}
        />
        <KpiCard
          title="Délai → 1re campagne"
          value={
            adventure?.content.medianHoursToFirstCampaign != null
              ? `${adventure.content.medianHoursToFirstCampaign} h`
              : "—"
          }
          icon={Landmark}
          sub="Activation contenu, pas table"
          info={KPI_INFO.delayFirstCampaign}
        />
        <KpiCard
          title="Campagnes mortes"
          value={dead != null ? String(dead) : "—"}
          icon={Ghost}
          sub="Créées sur la période, jamais lancées"
          info={KPI_INFO.deadCampaigns}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          title="Gift → payant"
          value={adventure ? `${adventure.economy.giftToPaidRate}%` : "—"}
          icon={Coins}
          sub="Comptes de la période ayant acheté des wheels"
          info={KPI_INFO.giftToPaid}
        />
        <KpiCard
          title="Concentration MJ"
          value={formatRate(concentration)}
          icon={Landmark}
          sub="Part des tables du top 10 % des MJ"
          info={KPI_INFO.gmConcentration}
          color="text-(--red)"
        />
      </div>
    </div>
  );
}
