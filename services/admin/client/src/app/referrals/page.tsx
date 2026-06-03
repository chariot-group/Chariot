"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/utils";
import getApiClient from "@/services/ApiService";

interface ReferralItem {
  id: string;
  code: string;
  userId: string;
  pendingReferralsCount: number;
  currentDiscountPercent: number;
  refereeCount: number;
  createdAt: string;
}

interface ReferralPaymentItem {
  id: string;
  userId: string;
  discountType: "referee" | "referrer";
  discountPercent: number;
  orderId: string;
  orderAmount: number;
  discountAmount: number;
  usedAt: string;
  referralId: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [referralPayments, setReferralPayments] = useState<ReferralPaymentItem[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const res = await getApiClient().get<{ data: PaginatedResponse<ReferralItem> }>("/referral?page=1&limit=100");
      setReferrals(res.data.data.data);
    } catch {
      toast.error("Erreur lors du chargement des parrainages");
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  const fetchReferralPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await getApiClient().get<{ data: PaginatedResponse<ReferralPaymentItem> }>(
        "/referral/payments?page=1&limit=100",
      );
      setReferralPayments(res.data.data.data);
    } catch {
      toast.error("Erreur lors du chargement des paiements de parrainage");
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
    fetchReferralPayments();
  }, [fetchReferrals, fetchReferralPayments]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parrainage</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchReferrals();
            fetchReferralPayments();
          }}
          disabled={loadingReferrals || loadingPayments}
          className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loadingReferrals || loadingPayments ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Referrals list */}
      <Card>
        <CardHeader>
          <CardTitle>Codes parrains ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Filleuls</TableHead>
                <TableHead>En attente</TableHead>
                <TableHead>Réduction dispo.</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8">
                    {loadingReferrals ? "Chargement…" : "Aucun parrainage"}
                  </TableCell>
                </TableRow>
              )}
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-bold">{r.code}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.userId}</TableCell>
                  <TableCell>{r.refereeCount}</TableCell>
                  <TableCell>
                    {r.pendingReferralsCount > 0 ? (
                      <Badge variant="secondary">{r.pendingReferralsCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.currentDiscountPercent > 0 ? (
                      <Badge>{r.currentDiscountPercent}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referral payments list */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements avec réduction parrainage ({referralPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Montant commande</TableHead>
                <TableHead>Montant réduit</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Utilisé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referralPayments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    {loadingPayments ? "Chargement…" : "Aucun paiement de parrainage"}
                  </TableCell>
                </TableRow>
              )}
              {referralPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.userId}</TableCell>
                  <TableCell>
                    <Badge variant={p.discountType === "referee" ? "secondary" : "outline"}>
                      {p.discountType === "referee" ? "Filleul" : "Parrain"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{p.discountPercent}%</TableCell>
                  <TableCell>{formatCents(p.orderAmount)}</TableCell>
                  <TableCell className="text-green-600">-{formatCents(p.discountAmount)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.orderId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.usedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
