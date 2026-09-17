"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Clock, CreditCard, Repeat, Sprout, Users } from "lucide-react";
import { KpiCard } from "@/components/kpi/KpiCard";
import { PeriodControls } from "@/components/kpi/PeriodControls";
import { Button } from "@/components/ui/button";
import { useBusinessPeriodLoader } from "@/hooks/useBusinessPeriodLoader";
import { fetchAdventureBusiness, fetchPaymentBusiness, fetchSessionBusiness } from "@/services/BusinessAnalyticsService";
import { conversionRate, formatRate, medianDelayHours } from "@/lib/businessFunnel";
import { KPI_INFO } from "@/lib/businessKpiCopy";
import type {
  AdventureBusinessAnalytics,
  PaymentBusinessAnalytics,
  Period,
  SessionBusinessAnalytics,
} from "@/lib/businessKpis.types";

type PaymentPageData = {
  payment: PaymentBusinessAnalytics | null;
  session: SessionBusinessAnalytics | null;
  adventure: AdventureBusinessAnalytics | null;
  failed: string[];
};

async function loadPaymentPage(range: { period: Period; from: string; to: string }): Promise<PaymentPageData> {
  const [payment, session, adventure] = await Promise.allSettled([
    fetchPaymentBusiness(range),
    fetchSessionBusiness(range),
    fetchAdventureBusiness(range),
  ]);
  const failed: string[] = [];
  if (payment.status === "rejected") failed.push("Payment");
  if (session.status === "rejected") failed.push("Session");
  if (adventure.status === "rejected") failed.push("Adventure");
  return {
    payment: payment.status === "fulfilled" ? payment.value : null,
    session: session.status === "fulfilled" ? session.value : null,
    adventure: adventure.status === "fulfilled" ? adventure.value : null,
    failed,
  };
}

export default function PaymentKpiPage() {
  const loader = useBusinessPeriodLoader(
    loadPaymentPage,
    "business-payment-load-error",
    "Erreur lors du chargement des KPI paiement",
  );
  const onPreset = useCallback((index: number) => loader.setPreset(index), [loader]);
  const payment = loader.data?.payment;
  const session = loader.data?.session;
  const adventure = loader.data?.adventure;
  const delay =
    payment && session
      ? medianDelayHours(session.firstLaunchByUser, payment.monetization.firstPurchaseByUser)
      : null;
  const payingShare = conversionRate(
    payment?.monetization.payingUsers ?? 0,
    session?.funnel.activation ?? 0,
  );

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
          title="1re table → 1er achat"
          value={delay != null ? `${delay} h` : "—"}
          icon={Clock}
          sub="Médiane, achats après la première table"
          info={KPI_INFO.firstTableToPurchase}
        />
        <KpiCard
          title="Repeat purchase"
          value={payment ? `${payment.monetization.repeatPurchaseRate}%` : "—"}
          icon={Repeat}
          sub={
            payment
              ? `${payment.monetization.repeatPurchasers} 2e achats / ${payment.monetization.firstPurchasers} 1ers`
              : undefined
          }
          info={KPI_INFO.repeatPurchase}
        />
        <KpiCard
          title="Payants parmi activés"
          value={formatRate(payingShare)}
          icon={Users}
          sub="Monétisation réelle du funnel"
          info={KPI_INFO.payingAmongActivated}
        />
        <KpiCard
          title="1ers achats"
          value={payment ? String(payment.monetization.firstPurchasers) : "—"}
          icon={CreditCard}
          sub="Comptes dont le 1er paiement tombe dans la période"
          info={KPI_INFO.firstPurchases}
          color="text-(--green)"
        />
        <KpiCard
          title="Gift → payant"
          value={adventure ? `${adventure.economy.giftToPaidRate}%` : "—"}
          icon={Sprout}
          sub="Comptes de la période ayant acheté des wheels"
          info={KPI_INFO.giftToPaid}
        />
        <KpiCard
          title="Filleuls validés"
          value={payment ? String(payment.funnel.referralValidated) : "—"}
          icon={Sprout}
          sub="1er achat du filleul validé"
          info={KPI_INFO.referralValidated}
        />
      </div>

      <Button
        asChild
        variant="outline">
        <Link href="/">Voir le P&L paiements (revenus, promos, affiliations)</Link>
      </Button>
    </div>
  );
}
