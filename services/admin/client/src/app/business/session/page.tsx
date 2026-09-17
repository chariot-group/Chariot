"use client";

import { useCallback } from "react";
import { Clock, DoorOpen, Repeat, Swords, Timer, Users } from "lucide-react";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PeriodControls } from "@/components/kpi/PeriodControls";
import { useBusinessPeriodLoader } from "@/hooks/useBusinessPeriodLoader";
import { fetchSessionBusiness } from "@/services/BusinessAnalyticsService";
import { KPI_INFO } from "@/lib/businessKpiCopy";

export default function SessionKpiPage() {
  const loader = useBusinessPeriodLoader(
    fetchSessionBusiness,
    "business-session-load-error",
    "Erreur lors du chargement des KPI Session",
  );
  const onPreset = useCallback((index: number) => loader.setPreset(index), [loader]);
  const data = loader.data;

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
      {loader.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Données session indisponibles.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Conversion lobby"
          value={data ? `${data.lobby.conversionRate}%` : "—"}
          icon={DoorOpen}
          sub={data ? `${data.lobby.launched} lancées · ${data.lobby.abandoned} abandonnées` : undefined}
          info={KPI_INFO.lobbyLaunch}
          color="text-(--green)"
        />
        <KpiCard
          title="Temps vers launch"
          value={data?.lobby.medianMinutesToLaunch != null ? `${data.lobby.medianMinutesToLaunch} min` : "—"}
          icon={Clock}
          sub="Médiane create → launchedAt"
          info={KPI_INFO.timeToLaunch}
        />
        <KpiCard
          title="Participants au launch"
          value={data ? String(data.lobby.avgParticipantsAtLaunch) : "—"}
          icon={Users}
          sub={data ? `${data.lobby.soloGmLaunchRate}% de tables MJ seul` : undefined}
          info={KPI_INFO.participantsAtLaunch}
        />
        <KpiCard
          title="Close anticipé"
          value={data ? `${data.lobby.earlyCloseRate}%` : "—"}
          icon={Timer}
          sub="Fermées avant les 8 h"
          info={KPI_INFO.earlyClose}
          color="text-(--yellow)"
        />
        <KpiCard
          title="MJ / joueurs récurrents"
          value={data ? `${data.lobby.repeatGmCount} / ${data.lobby.repeatPlayerCount}` : "—"}
          icon={Repeat}
          sub="Au moins 2 tables sur la période"
          info={KPI_INFO.repeatPlayers}
        />
        <KpiCard
          title="Live maintenant"
          value={data ? String(data.live.launchedOpen) : "—"}
          icon={Swords}
          sub={data ? `${data.live.connectedParticipants} participants connectés` : undefined}
          info={KPI_INFO.liveNow}
          color="text-(--green)"
        />
      </div>
    </div>
  );
}
