import {
  getAdventureApiClient,
  getPaymentApiClient,
  getSessionApiClient,
} from "@/services/ApiService";
import type {
  AdventureBusinessAnalytics,
  PaymentBusinessAnalytics,
  Period,
  SessionBusinessAnalytics,
} from "@/lib/businessKpis.types";

type Range = { period: Period; from: string; to: string };

function params(range: Range) {
  return { params: range };
}

export async function fetchAdventureBusiness(range: Range): Promise<AdventureBusinessAnalytics> {
  const res = await getAdventureApiClient().get<AdventureBusinessAnalytics>("/analytics/business", params(range));
  return res.data;
}

export async function fetchSessionBusiness(range: Range): Promise<SessionBusinessAnalytics> {
  const res = await getSessionApiClient().get<SessionBusinessAnalytics>("/analytics/business", params(range));
  return res.data;
}

export async function fetchPaymentBusiness(range: Range): Promise<PaymentBusinessAnalytics> {
  const res = await getPaymentApiClient().get<PaymentBusinessAnalytics>("/analytics/business", params(range));
  return res.data;
}

export type BusinessDashboardBundle = {
  adventure: AdventureBusinessAnalytics | null;
  session: SessionBusinessAnalytics | null;
  payment: PaymentBusinessAnalytics | null;
  failed: Array<"adventure" | "session" | "payment">;
};

export async function fetchBusinessDashboard(range: Range): Promise<BusinessDashboardBundle> {
  const [adventure, session, payment] = await Promise.allSettled([
    fetchAdventureBusiness(range),
    fetchSessionBusiness(range),
    fetchPaymentBusiness(range),
  ]);

  const failed: BusinessDashboardBundle["failed"] = [];
  if (adventure.status === "rejected") failed.push("adventure");
  if (session.status === "rejected") failed.push("session");
  if (payment.status === "rejected") failed.push("payment");

  if (failed.length === 3) {
    throw new Error("All business analytics services failed");
  }

  return {
    adventure: adventure.status === "fulfilled" ? adventure.value : null,
    session: session.status === "fulfilled" ? session.value : null,
    payment: payment.status === "fulfilled" ? payment.value : null,
    failed,
  };
}
