"use client";

import { useCallback } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Flame, Swords, UserMinus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiTitle } from "@/components/kpi/KpiInfo";
import { PeriodControls } from "@/components/kpi/PeriodControls";
import { useBusinessPeriodLoader } from "@/hooks/useBusinessPeriodLoader";
import { fetchBusinessDashboard } from "@/services/BusinessAnalyticsService";
import {
  composeFunnelSteps,
  conversionRate,
  formatKpiCount,
  formatRate,
  mergeTimeSeries,
  spentGiftNeverBoughtCount,
} from "@/lib/businessFunnel";
import { KPI_INFO } from "@/lib/businessKpiCopy";

function DomainError({ names }: { names: string[] }) {
  if (names.length === 0) {
    return null;
  }
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      Impossible de charger : {names.join(", ")}. Les autres indicateurs restent affichés.
    </p>
  );
}

export default function BusinessDashboardPage() {
  const loader = useBusinessPeriodLoader(
    fetchBusinessDashboard,
    "business-dashboard-load-error",
    "Erreur lors du chargement du dashboard business",
  );

  const onPreset = useCallback((index: number) => loader.setPreset(index), [loader]);

  const adventure = loader.data?.adventure;
  const session = loader.data?.session;
  const payment = loader.data?.payment;
  const steps = composeFunnelSteps({
    acquisition: adventure?.funnel.acquisition ?? 0,
    activation: session?.funnel.activation ?? 0,
    retention: session?.funnel.retention ?? 0,
    referral: payment?.funnel.referralValidated ?? 0,
    revenue: payment?.funnel.firstPurchase ?? 0,
  });
  const payingShare = conversionRate(
    payment?.monetization.payingUsers ?? 0,
    session?.funnel.activation ?? 0,
  );
  const chartData = mergeTimeSeries({
    acquisition: adventure?.funnel.acquisitionOverTime ?? [],
    activation: session?.funnel.activationOverTime ?? [],
    retention: session?.funnel.retentionOverTime ?? [],
    referral: payment?.funnel.referralOverTime ?? [],
    revenue: payment?.funnel.firstPurchaseOverTime ?? [],
  });
  const maxFunnel = Math.max(1, ...steps.map((step) => step.count));

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
      <DomainError names={loader.data?.failed ?? []} />

      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-5"
        aria-label="Entonnoir AARRR">
        {steps.map((step) => (
          <Card key={step.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <KpiTitle info={step.info}>{step.label}</KpiTitle>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-card-foreground">{loader.data ? step.count : "—"}</p>
              <p className="text-xs text-muted-foreground">{step.hint}</p>
              <div
                className="h-2 rounded-full bg-muted/40"
                aria-hidden>
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.round((step.count / maxFunnel) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Conversion : {loader.data ? formatRate(step.rateFromPrevious) : "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Lobby → launch"
          value={session ? `${session.lobby.conversionRate}%` : "—"}
          icon={Flame}
          sub={session ? `${session.lobby.launched} lancées / ${session.lobby.abandoned} abandonnées` : undefined}
          info={KPI_INFO.lobbyLaunch}
          color="text-(--green)"
        />
        <KpiCard
          title="Wheels en circulation"
          value={adventure ? String(adventure.economy.wheelsInCirculation) : "—"}
          icon={Coins}
          sub={
            adventure
              ? `Vendues ${adventure.economy.wheelsSold} · Dépensées ${adventure.economy.wheelsSpent}`
              : undefined
          }
          info={KPI_INFO.wheelsCirculation}
        />
        <KpiCard
          title="Payants parmi activés"
          value={formatRate(payingShare)}
          icon={Users}
          sub="Utilisateurs ayant joué une table"
          info={KPI_INFO.payingAmongActivated}
        />
        <KpiCard
          title="Sans achat shop"
          value={formatKpiCount(adventure?.economy.blockedUsers)}
          icon={UserMinus}
          sub={
            adventure
              ? `${adventure.economy.unusedGiftUsers} gift intact · ${spentGiftNeverBoughtCount(adventure.economy)} gift consommé`
              : "Gift intact + gift consommé, sans boutique"
          }
          info={KPI_INFO.noShopPurchase}
          color="text-(--yellow)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <KpiTitle info={KPI_INFO.gmVsPlayer}>Activation MJ vs joueur</KpiTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">MJ</p>
                  <p className="text-2xl font-bold">{session.funnel.gmActivated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Joueurs</p>
                  <p className="text-2xl font-bold">{session.funnel.playerActivated}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loader.loading ? "Chargement…" : "Données session indisponibles"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <KpiTitle info={KPI_INFO.liveNow}>Tables live</KpiTitle>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session ? (
              <div className="flex items-center gap-3">
                <Swords className="h-4 w-4 text-primary" />
                <p className="text-sm text-card-foreground">
                  {session.live.launchedOpen} table{session.live.launchedOpen > 1 ? "s" : ""} ouverte
                  {session.live.launchedOpen > 1 ? "s" : ""} · {session.live.connectedParticipants}{" "}
                  participant{session.live.connectedParticipants > 1 ? "s" : ""} connecté
                  {session.live.connectedParticipants > 1 ? "s" : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loader.loading ? "Chargement…" : "Données session indisponibles"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>
              <KpiTitle info={KPI_INFO.funnelChart}>Évolution des étapes</KpiTitle>
            </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={280}>
              <AreaChart
                data={chartData}
                aria-label="Évolution des étapes AARRR">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2b2b2b"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#666" }}
                  tickFormatter={(value: string) => {
                    const parts = value.split("-");
                    return parts.length >= 3 ? `${parts[2]}-${parts[1]}` : value;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#666" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#19191c", border: "1px solid #2b2b2b", borderRadius: "8px" }}
                  labelStyle={{ color: "#f7f7f7", fontSize: 12 }}
                  itemStyle={{ color: "#f7f7f7" }}
                />
                <Area
                  type="monotone"
                  dataKey="acquisition"
                  name="Acquisition"
                  stroke="#4e00de"
                  fill="#4e00de"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="activation"
                  name="Activation"
                  stroke="#9ae201"
                  fill="#9ae201"
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  dataKey="retention"
                  name="Rétention"
                  stroke="#61ebff"
                  fill="#61ebff"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="referral"
                  name="Recommandation"
                  stroke="#ffadff"
                  fill="#ffadff"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenu"
                  stroke="#ffc400"
                  fill="#ffc400"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              {loader.loading ? "Chargement…" : "Aucune donnée pour cette période"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
