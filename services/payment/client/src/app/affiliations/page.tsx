"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/utils";
import getApiClient from "@/services/ApiService";

interface Affiliation {
  id: string;
  code: string;
  name: string;
  creatorUserId: string;
  creatorName: string;
  creatorCommissionPercent: number;
  userDiscountPercent: number;
  totalUsages: number;
  totalCommissionAmount: number;
  isActive: boolean;
  createdAt: string;
}

const affiliationSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Majuscules, chiffres, tirets uniquement"),
  name: z.string().min(2).max(100),
  creatorUserId: z.string().min(1, "Keycloak ID requis"),
  creatorName: z.string().min(1).max(100),
  creatorCommissionPercent: z.coerce.number().int().min(0).max(100),
  userDiscountPercent: z.coerce.number().int().min(0).max(100),
});
type AffiliationFormData = z.infer<typeof affiliationSchema>;

function AffiliationForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<AffiliationFormData>;
  onSubmit: (data: AffiliationFormData) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AffiliationFormData>({
    resolver: zodResolver(affiliationSchema),
    defaultValues: {
      creatorCommissionPercent: 10,
      userDiscountPercent: 5,
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Code *</label>
          <Input
            {...register("code")}
            placeholder="CREATOR123"
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
              (e.target as HTMLInputElement).value = v.toUpperCase();
            }}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nom du programme *</label>
          <Input
            {...register("name")}
            placeholder="Affiliation Hugo"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Keycloak ID du créateur *</label>
          <Input
            {...register("creatorUserId")}
            placeholder="uuid-du-créateur"
          />
          {errors.creatorUserId && <p className="text-xs text-destructive">{errors.creatorUserId.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nom affiché du créateur *</label>
          <Input
            {...register("creatorName")}
            placeholder="HugoCreates"
          />
          {errors.creatorName && <p className="text-xs text-destructive">{errors.creatorName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Commission créateur (%)</label>
          <Input
            {...register("creatorCommissionPercent")}
            type="number"
            min={0}
            max={100}
            placeholder="10"
          />
          {errors.creatorCommissionPercent && (
            <p className="text-xs text-destructive">{errors.creatorCommissionPercent.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Réduction utilisateur (%)</label>
          <Input
            {...register("userDiscountPercent")}
            type="number"
            min={0}
            max={100}
            placeholder="5"
          />
          {errors.userDiscountPercent && (
            <p className="text-xs text-destructive">{errors.userDiscountPercent.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

export default function AffiliationsPage() {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Affiliation | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApiClient().get("/affiliations", {
        params: { page, limit, includeInactive },
      });
      setAffiliations(res.data.data ?? []);
      setTotal(res.data.pagination?.totalItems ?? 0);
    } catch {
      toast.error("Erreur lors du chargement des affiliations", { toastId: "affiliations-load-error" });
    } finally {
      setLoading(false);
    }
  }, [page, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: AffiliationFormData) => {
    setSaving(true);
    try {
      await getApiClient().post("/affiliations", data);
      toast.success("Affiliation créée !");
      setDialogMode(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: AffiliationFormData) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await getApiClient().patch(`/affiliations/${editTarget.id}`, data);
      toast.success("Affiliation mise à jour !");
      setDialogMode(null);
      setEditTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string, code: string) => {
    if (!confirm(`Désactiver l'affiliation "${code}" ?`)) return;
    try {
      await getApiClient().delete(`/affiliations/${id}`);
      toast.success("Affiliation désactivée");
      load();
    } catch {
      toast.error("Erreur lors de la désactivation");
    }
  };

  const filtered = affiliations.filter(
    (a) =>
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.creatorName.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un code, nom ou créateur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(1);
            }}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          Inclure inactifs
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="sm"
          onClick={() => setDialogMode("create")}>
          <Plus className="h-3.5 w-3.5" />
          Nouvelle affiliation
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {total} affiliation{total > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Créateur</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Réduction user</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Commissions versées</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8">
                    Aucune affiliation
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <code className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-card-foreground">
                        {a.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{a.creatorName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">{a.creatorUserId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.creatorCommissionPercent}%</TableCell>
                    <TableCell className="text-sm">{a.userDiscountPercent}%</TableCell>
                    <TableCell className="text-sm">{a.totalUsages}</TableCell>
                    <TableCell className="text-sm text-[var(--green)]">
                      {formatCents(a.totalCommissionAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.isActive ? "success" : "secondary"}>{a.isActive ? "Actif" : "Inactif"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditTarget(a);
                            setDialogMode("edit");
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {a.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeactivate(a.id, a.code)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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
            Page {page} sur {totalPages}
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

      {/* Create dialog */}
      <Dialog
        open={dialogMode === "create"}
        onOpenChange={(o) => !o && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle affiliation</DialogTitle>
            <DialogDescription>Créer un programme d&apos;affiliation pour un créateur de contenu.</DialogDescription>
          </DialogHeader>
          <AffiliationForm
            onSubmit={handleCreate}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={dialogMode === "edit"}
        onOpenChange={(o) => {
          if (!o) {
            setDialogMode(null);
            setEditTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;affiliation</DialogTitle>
            <DialogDescription>
              {editTarget?.code} — {editTarget?.creatorName}
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <AffiliationForm
              defaultValues={{
                code: editTarget.code,
                name: editTarget.name,
                creatorUserId: editTarget.creatorUserId,
                creatorName: editTarget.creatorName,
                creatorCommissionPercent: editTarget.creatorCommissionPercent,
                userDiscountPercent: editTarget.userDiscountPercent,
              }}
              onSubmit={handleEdit}
              loading={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
