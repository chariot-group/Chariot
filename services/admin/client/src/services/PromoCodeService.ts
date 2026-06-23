import { z } from "zod";

export interface PromoCode {
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

export const promoSchema = z.object({
    code: z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/, "Majuscules, chiffres, tirets uniquement"),
    name: z.string().min(2).max(100),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.coerce.number().int().min(1),
    isFirstOrderOnly: z.boolean().optional(),
    minOrderAmount: z.coerce.number().int().min(1).nullable().optional().catch(undefined),
    expiresAt: z.string().optional().nullable(),
    maxTotalUses: z.coerce.number().int().min(1).nullable().optional().catch(undefined),
    maxUsesPerUser: z.coerce.number().int().min(1).optional(),
});

export type PromoFormData = z.infer<typeof promoSchema>;
export type PromoSortField = "code" | "name" | "discountValue" | "currentTotalUses" | "expiresAt" | "isActive";
export type SortDir = "asc" | "desc";

export const PROMO_FORM_DEFAULT_VALUES: Partial<PromoFormData> = {
    discountType: "PERCENTAGE",
    maxUsesPerUser: 1,
    isFirstOrderOnly: false,
};

/** Path for PATCH deactivation — must not use DELETE (soft delete). See FR-admin-promo-lifecycle. */
export function getPromoCodeDeactivatePath(id: string): string {
    return `/promo-codes/${id}/deactivate`;
}

/** Path and body for PATCH reactivation. See FR-admin-promo-lifecycle. */
export function getPromoCodeReactivatePath(id: string): string {
    return `/promo-codes/${id}`;
}

export const PROMO_CODE_REACTIVATE_PAYLOAD = { isActive: true } as const;

export function toPromoPayload(data: PromoFormData): Omit<PromoFormData, "expiresAt" | "minOrderAmount" | "maxTotalUses"> & {
    expiresAt?: string;
    minOrderAmount?: number;
    maxTotalUses?: number;
} {
    return {
        ...data,
        minOrderAmount: data.minOrderAmount ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        maxTotalUses: data.maxTotalUses ?? undefined,
    };
}

export function filterPromoCodes(promoCodes: PromoCode[], search: string): PromoCode[] {
    const loweredSearch = search.toLowerCase();
    return promoCodes.filter((promoCode) =>
        promoCode.code.toLowerCase().includes(loweredSearch) || promoCode.name.toLowerCase().includes(loweredSearch),
    );
}

export function sortPromoCodes(promoCodes: PromoCode[], sortField: PromoSortField | null, sortDir: SortDir): PromoCode[] {
    return [...promoCodes].sort((a, b) => {
        if (!sortField) return 0;

        let cmp = 0;
        switch (sortField) {
            case "code":
                cmp = a.code.localeCompare(b.code);
                break;
            case "name":
                cmp = a.name.localeCompare(b.name);
                break;
            case "discountValue":
                cmp = a.discountValue - b.discountValue;
                break;
            case "currentTotalUses":
                cmp = a.currentTotalUses - b.currentTotalUses;
                break;
            case "expiresAt":
                cmp = (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999");
                break;
            case "isActive":
                cmp = Number(b.isActive) - Number(a.isActive);
                break;
        }

        return sortDir === "asc" ? cmp : -cmp;
    });
}
