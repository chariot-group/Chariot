"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/utils";
import getApiClient from "@/services/ApiService";

type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

interface Payment {
  id: string;
  userId: string;
  stripeSessionId: string | null;
  amount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: PaymentStatus;
  promoCode?: { code: string } | null;
  affiliation?: { code: string; creatorName: string } | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<PaymentStatus, "success" | "warning" | "destructive" | "secondary"> = {
  COMPLETED: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: "Complété",
  PENDING: "En attente",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.userId = search.trim();

      const res = await getApiClient().get("/payments", { params });
      setPayments(res.data.data ?? []);
      setTotal(res.data.pagination?.totalItems ?? 0);
    } catch {
      toast.error("Erreur lors du chargement des paiements", { toastId: "payments-load-error" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrer par Keycloak ID utilisateur…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="COMPLETED">Complétés</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="FAILED">Échoués</SelectItem>
            <SelectItem value="REFUNDED">Remboursés</SelectItem>
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {total} paiement{total > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Montant brut</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Montant final</TableHead>
                <TableHead>Code promo</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground truncate block max-w-28">{p.userId}</code>
                    </TableCell>
                    <TableCell className="text-sm">{formatCents(p.amount)}</TableCell>
                    <TableCell className="text-sm text-[var(--yellow)]">
                      {p.discountAmount > 0 ? `-${formatCents(p.discountAmount)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-card-foreground">
                      {formatCents(p.finalAmount)}
                    </TableCell>
                    <TableCell>
                      {p.promoCode ? (
                        <code className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-card-foreground">
                          {p.promoCode.code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.affiliation ? (
                        <div>
                          <code className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-card-foreground">
                            {p.affiliation.code}
                          </code>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.affiliation.creatorName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} sur {totalPages} — {total} résultat{total > 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
