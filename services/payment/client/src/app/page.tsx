"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, CreditCard, Users, Percent, RefreshCw, ArrowDownLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import getApiClient from "@/services/ApiService";
import { toast } from "react-toastify";

type Period = "daily" | "weekly" | "monthly";

interface DashboardData {
  kpis: {
    totalRevenue: number;
    totalPayments: number;
    completedPayments: number;
    failedPayments: number;
    refundedPayments: number;
    completionRate: number;
    avgOrderValue: number;
    totalDiscounts: number;
    totalCommissions: number;
  };
  revenueOverTime: { date: string; revenue: number; payments: number; discounts: number }[];
  topAffiliations: {
    id: string;
    code: string;
    name: string;
    creatorName: string;
    totalUsages: number;
    totalCommission: number;
    totalRevenue: number;
    isActive: boolean;
  }[];
  topPromoCodes: {
    id: string;
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    totalUsages: number;
    totalDiscount: number;
    isActive: boolean;
  }[];
  paymentStatusBreakdown: Record<string, number>;
}

const PIE_COLORS: Record<string, string> = {
  COMPLETED: "#9ae201",
  PENDING: "#ffc400",
  FAILED: "#ff2d2d",
  REFUNDED: "#61ebff",
};

const PERIOD_PRESETS = [
  { label: "7 derniers jours", days: 7, period: "daily" as Period },
  { label: "30 derniers jours", days: 30, period: "daily" as Period },
  { label: "3 derniers mois", days: 90, period: "weekly" as Period },
  { label: "12 derniers mois", days: 365, period: "monthly" as Period },
];

function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
  color = "text-primary",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState(1); // default: 30 jours
  const [period, setPeriod] = useState<Period>("daily");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { days, period: defaultPeriod } = PERIOD_PRESETS[preset];
      const activePeriod = period ?? defaultPeriod;
      const to = new Date();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const res = await getApiClient().get<DashboardData>("/analytics/dashboard", {
        params: {
          period: activePeriod,
          from: from.toISOString().slice(0, 10),
          to: to.toISOString().slice(0, 10),
        },
      });
      setData(res.data);
    } catch {
      toast.error("Erreur lors du chargement du dashboard", { toastId: "dashboard-load-error" });
    } finally {
      setLoading(false);
    }
  }, [preset, period]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync period with preset default
  useEffect(() => {
    setPeriod(PERIOD_PRESETS[preset].period);
  }, [preset]);

  const pieData = data
    ? Object.entries(data.paymentStatusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPreset(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === i
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-card-foreground"
            }`}>
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Journalier</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Revenus totaux"
          value={data ? formatCents(data.kpis.totalRevenue) : "—"}
          icon={TrendingUp}
          sub={data ? `${data.kpis.completedPayments} paiements complétés` : undefined}
          color="text-[var(--green)]"
        />
        <KpiCard
          title="Paiements totaux"
          value={data ? String(data.kpis.totalPayments) : "—"}
          icon={CreditCard}
          sub={data ? `Taux complétion: ${data.kpis.completionRate}%` : undefined}
        />
        <KpiCard
          title="Panier moyen"
          value={data ? formatCents(data.kpis.avgOrderValue) : "—"}
          icon={Users}
          sub="Paiements complétés"
        />
        <KpiCard
          title="Remises accordées"
          value={data ? formatCents(data.kpis.totalDiscounts) : "—"}
          icon={Percent}
          sub={data ? `Commissions: ${formatCents(data.kpis.totalCommissions)}` : undefined}
          color="text-[var(--yellow)]"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus dans le temps</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.revenueOverTime.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={280}>
              <AreaChart data={data.revenueOverTime}>
                <defs>
                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor="#4e00de"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#4e00de"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorDiscounts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor="#ffc400"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#ffc400"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2b2b2b"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#666" }}
                  tickFormatter={(v) => {
                    const [, mm, dd] = v.split("-");
                    return `${dd}-${mm}`;
                  }}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 100).toFixed(0)}€`}
                  tick={{ fontSize: 11, fill: "#666" }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#19191c", border: "1px solid #2b2b2b", borderRadius: "8px" }}
                  labelStyle={{ color: "#f7f7f7", fontSize: 12 }}
                  itemStyle={{ color: "#f7f7f7" }}
                  labelFormatter={(v) => {
                    const [yyyy, mm, dd] = v.split("-");
                    return `${dd}-${mm}-${yyyy}`;
                  }}
                  formatter={(value: number, name: string) => [
                    formatCents(value),
                    name === "revenue" ? "Revenus" : "Remises",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4e00de"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="discounts"
                  stroke="#ffc400"
                  strokeWidth={1.5}
                  fill="url(#colorDiscounts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Chargement…" : "Aucune donnée pour cette période"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Statuts des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value">
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[entry.name] ?? "#666"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#19191c", border: "1px solid #2b2b2b", borderRadius: "8px" }}
                    labelStyle={{ color: "#f7f7f7" }}
                    itemStyle={{ color: "#f7f7f7" }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: "#b2b2b2", fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                {loading ? "Chargement…" : "Aucune donnée"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top affiliations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top créateurs affiliés</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.topAffiliations.filter((a) => a.totalUsages > 0).length > 0 ? (
              <div className="space-y-3">
                {data.topAffiliations
                  .filter((a) => a.totalUsages > 0)
                  .slice(0, 8)
                  .map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-card-foreground truncate">{a.creatorName}</span>
                          <Badge
                            variant={a.isActive ? "success" : "secondary"}
                            className="shrink-0">
                            {a.code}
                          </Badge>
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {a.totalUsages} client{a.totalUsages > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Commission: {formatCents(a.totalCommission)}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[var(--green)] shrink-0">
                        {formatCents(a.totalRevenue)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {loading ? "Chargement…" : "Aucun créateur avec des ventes sur cette période"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promo codes bar chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Performance des codes promo</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-[var(--yellow)]" />
          </div>
        </CardHeader>
        <CardContent>
          {data && data.topPromoCodes.filter((p) => p.totalUsages > 0).length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={200}>
              <BarChart
                data={data.topPromoCodes.filter((p) => p.totalUsages > 0).slice(0, 10)}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2b2b2b"
                  vertical={false}
                />
                <XAxis
                  dataKey="code"
                  tick={{ fontSize: 11, fill: "#666" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#666" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#19191c", border: "1px solid #2b2b2b", borderRadius: "8px" }}
                  labelStyle={{ color: "#f7f7f7", fontSize: 12 }}
                  itemStyle={{ color: "#f7f7f7" }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(value: number, name: string) => [
                    name === "totalUsages" ? value : formatCents(value),
                    name === "totalUsages" ? "Utilisations" : "Remise totale",
                  ]}
                />
                <Bar
                  dataKey="totalUsages"
                  fill="#4e00de"
                  radius={[4, 4, 0, 0]}
                  name="totalUsages"
                />
                <Bar
                  dataKey="totalDiscount"
                  fill="#ffc400"
                  radius={[4, 4, 0, 0]}
                  name="totalDiscount"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {loading ? "Chargement…" : "Aucun code promo utilisé sur cette période"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
