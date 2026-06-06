"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { KeycloakUserId } from "@/components/KeycloakUserId";
import { formatDate } from "@/lib/utils";
import { buildReferralsParams, getApiClient } from "@/services";
import { type ReferralItem } from "@/app/referrals/referrals.types";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 100;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildReferralsParams(page, limit, search);
      const res = await getApiClient().get("/referral", { params });
      setReferrals(res.data.data ?? []);
      setTotal(res.data.pagination?.totalItems ?? 0);
    } catch {
      toast.error("Erreur lors du chargement des parrainages", { toastId: "referrals-load-error" });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrer par nom ou Keycloak ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
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
            {total} code{total > 1 ? "s" : ""} parrain
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : referrals.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    Aucun parrainage trouvé
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold">{r.code}</TableCell>
                    <TableCell>
                      {r.username ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-card-foreground">{r.username}</span>
                          <KeycloakUserId userId={r.userId} />
                        </div>
                      ) : (
                        <KeycloakUserId userId={r.userId} />
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
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
