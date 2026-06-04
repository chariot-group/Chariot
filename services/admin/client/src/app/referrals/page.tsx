"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import getApiClient from "@/services/ApiService";

interface ReferralItem {
  id: string;
  code: string;
  userId: string;
  username: string | null;
  pendingReferralsCount: number;
  currentDiscountPercent: number;
  refereeCount: number;
  validatedRefereeCount: number;
  nonPayingRefereesCount: number;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  const fetchReferrals = useCallback(async () => {
    setLoadingReferrals(true);
    try {
      const res = await getApiClient().get<{ data: PaginatedResponse<ReferralItem> }>("/referral?page=1&limit=100");
      setReferrals(res.data.data as unknown as ReferralItem[]);
    } catch {
      toast.error("Erreur lors du chargement des parrainages");
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchReferrals();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchReferrals]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parrainage</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchReferrals();
          }}
          disabled={loadingReferrals}
          className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loadingReferrals ? "animate-spin" : ""}`} />
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
                <TableHead>Utilisateur</TableHead>
                <TableHead>Filleuls valides</TableHead>
                <TableHead>Depuis dernier paiement</TableHead>
                <TableHead>Sans paiement</TableHead>
                <TableHead>Réduction dispo.</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    {loadingReferrals ? "Chargement…" : "Aucun parrainage"}
                  </TableCell>
                </TableRow>
              )}
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-bold">{r.code}</TableCell>
                  <TableCell>
                    {r.username ? (
                      <div>
                        <span className="text-sm text-card-foreground">{r.username}</span>
                        <code className="text-xs text-muted-foreground truncate block max-w-36">{r.userId}</code>
                      </div>
                    ) : (
                      <code className="text-xs text-muted-foreground truncate block max-w-36">{r.userId}</code>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.validatedRefereeCount > 0 ? (
                      <Badge variant="success">{r.validatedRefereeCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.pendingReferralsCount > 0 ? (
                      <Badge variant="secondary">{r.pendingReferralsCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.nonPayingRefereesCount > 0 ? (
                      <Badge variant="warning">{r.nonPayingRefereesCount}</Badge>
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
    </div>
  );
}
