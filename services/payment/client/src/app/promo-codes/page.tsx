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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCents, formatDate } from "@/lib/utils";
import getApiClient from "@/services/ApiService";

interface PromoCode {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isFirstOrderOnly: boolean;
  minOrderAmount: number | null;
  expiresAt: string | null;
  maxTotalUses: number | null;
  maxUsesPerUser: number;
  currentTotalUses: number;
  isActive: boolean;
  createdAt: string;
}

const promoSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Majuscules, chiffres, tirets uniquement"),
  name: z.string().min(2).max(100),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().int().min(1),
  isFirstOrderOnly: z.boolean().optional(),
  minOrderAmount: z.coerce.number().int().min(0).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  maxTotalUses: z.coerce.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.coerce.number().int().min(1).optional(),
});
type PromoFormData = z.infer<typeof promoSchema>;

function PromoForm({
  defaultValues,
  onSubmit,
  loading,
}: {
  defaultValues?: Partial<PromoFormData>;
  onSubmit: (data: PromoFormData) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      discountType: "PERCENTAGE",
      maxUsesPerUser: 1,
      isFirstOrderOnly: false,
      ...defaultValues,
    },
  });

  const discountType = watch("discountType");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Code *</label>
          <Input
            {...register("code")}
            placeholder="SUMMER20"
            className="uppercase"
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
              (e.target as HTMLInputElement).value = v.toUpperCase();
            }}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nom *</label>
          <Input
            {...register("name")}
            placeholder="Promo été 2025"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Type de réduction *</label>
          <Select
            value={discountType}
            onValueChange={(v) => setValue("discountType", v as "PERCENTAGE" | "FIXED")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
              <SelectItem value="FIXED">Montant fixe (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Valeur * {discountType === "PERCENTAGE" ? "(0–100)" : "(centimes)"}
          </label>
          <Input
            {...register("discountValue")}
            type="number"
            placeholder={discountType === "PERCENTAGE" ? "20" : "500"}
          />
          {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Montant min. panier (centimes)</label>
          <Input
            {...register("minOrderAmount")}
            type="number"
            placeholder="5000 = 50€"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Expiration</label>
          <Input
            {...register("expiresAt")}
            type="date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Max utilisations totales</label>
          <Input
            {...register("maxTotalUses")}
            type="number"
            placeholder="Illimité"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Max par utilisateur</label>
          <Input
            {...register("maxUsesPerUser")}
            type="number"
            placeholder="1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isFirstOrderOnly"
          {...register("isFirstOrderOnly")}
          className="h-4 w-4 rounded border-border bg-muted accent-primary"
        />
        <label
          htmlFor="isFirstOrderOnly"
          className="text-sm text-card-foreground">
          Première commande uniquement
        </label>
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

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApiClient().get("/promo-codes", {
        params: { page, limit, includeInactive },
      });
      setPromoCodes(res.data.data ?? []);
      setTotal(res.data.pagination?.totalItems ?? 0);
    } catch {
      toast.error("Erreur lors du chargement des codes promo", { toastId: "promo-codes-load-error" });
    } finally {
      setLoading(false);
    }
  }, [page, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: PromoFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        minOrderAmount: data.minOrderAmount ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        maxTotalUses: data.maxTotalUses ?? undefined,
      };
      await getApiClient().post("/promo-codes", payload);
      toast.success("Code promo créé !");
      setDialogMode(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: PromoFormData) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const payload = {
        ...data,
        minOrderAmount: data.minOrderAmount ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        maxTotalUses: data.maxTotalUses ?? undefined,
      };
      await getApiClient().patch(`/promo-codes/${editTarget.id}`, payload);
      toast.success("Code promo mis à jour !");
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
    if (!confirm(`Désactiver le code "${code}" ?`)) return;
    try {
      await getApiClient().delete(`/promo-codes/${id}`);
      toast.success("Code promo désactivé");
      load();
    } catch {
      toast.error("Erreur lors de la désactivation");
    }
  };

  const filtered = promoCodes.filter(
    (p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un code ou un nom…"
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
          Nouveau code
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {total} code{total > 1 ? "s" : ""} promo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8">
                    Aucun code promo
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <code className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-card-foreground">
                        {p.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-card-foreground">{p.name}</TableCell>
                    <TableCell className="text-sm">
                      {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : formatCents(p.discountValue)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.currentTotalUses}
                      {p.maxTotalUses ? ` / ${p.maxTotalUses}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.expiresAt ? formatDate(p.expiresAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Actif" : "Inactif"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditTarget(p);
                            setDialogMode("edit");
                          }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {p.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeactivate(p.id, p.code)}>
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
            <DialogTitle>Nouveau code promo</DialogTitle>
            <DialogDescription>Créer un code de réduction pour vos utilisateurs.</DialogDescription>
          </DialogHeader>
          <PromoForm
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
            <DialogTitle>Modifier le code promo</DialogTitle>
            <DialogDescription>{editTarget?.code}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <PromoForm
              defaultValues={{
                code: editTarget.code,
                name: editTarget.name,
                discountType: editTarget.discountType,
                discountValue: editTarget.discountValue,
                isFirstOrderOnly: editTarget.isFirstOrderOnly,
                minOrderAmount: editTarget.minOrderAmount,
                expiresAt: editTarget.expiresAt ? editTarget.expiresAt.slice(0, 10) : null,
                maxTotalUses: editTarget.maxTotalUses,
                maxUsesPerUser: editTarget.maxUsesPerUser,
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
