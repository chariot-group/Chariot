import { z } from "zod";

export interface Affiliation {
    id: string;
    code: string;
    name: string;
    creatorName: string;
    creatorCommissionPercent: number;
    userDiscountPercent: number;
    totalUsages: number;
    totalCommissionAmount: number;
    isActive: boolean;
    createdAt: string;
}

export const affiliationSchema = z.object({
    code: z
        .string()
        .min(3)
        .max(32)
        .regex(/^[A-Z0-9_-]+$/, "Majuscules, chiffres, tirets uniquement"),
    name: z.string().min(2).max(100),
    creatorName: z.string().min(1).max(100),
    creatorCommissionPercent: z.coerce.number().int().min(0).max(100),
    userDiscountPercent: z.coerce.number().int().min(0).max(100),
});

export type AffiliationFormData = z.infer<typeof affiliationSchema>;
export type AffiliationSortField =
    | "code"
    | "creatorName"
    | "creatorCommissionPercent"
    | "userDiscountPercent"
    | "totalUsages"
    | "totalCommissionAmount"
    | "isActive";

export type SortDir = "asc" | "desc";

export const AFFILIATION_FORM_DEFAULT_VALUES: Partial<AffiliationFormData> = {
    creatorCommissionPercent: 10,
    userDiscountPercent: 5,
};

export function filterAffiliations(affiliations: Affiliation[], search: string): Affiliation[] {
    const loweredSearch = search.toLowerCase();

    return affiliations.filter(
        (affiliation) =>
            affiliation.code.toLowerCase().includes(loweredSearch) ||
            affiliation.name.toLowerCase().includes(loweredSearch) ||
            affiliation.creatorName.toLowerCase().includes(loweredSearch),
    );
}

export function sortAffiliations(
    affiliations: Affiliation[],
    sortField: AffiliationSortField | null,
    sortDir: SortDir,
): Affiliation[] {
    return [...affiliations].sort((a, b) => {
        if (!sortField) return 0;

        let cmp = 0;
        switch (sortField) {
            case "code":
                cmp = a.code.localeCompare(b.code);
                break;
            case "creatorName":
                cmp = a.creatorName.localeCompare(b.creatorName);
                break;
            case "creatorCommissionPercent":
                cmp = a.creatorCommissionPercent - b.creatorCommissionPercent;
                break;
            case "userDiscountPercent":
                cmp = a.userDiscountPercent - b.userDiscountPercent;
                break;
            case "totalUsages":
                cmp = a.totalUsages - b.totalUsages;
                break;
            case "totalCommissionAmount":
                cmp = a.totalCommissionAmount - b.totalCommissionAmount;
                break;
            case "isActive":
                cmp = Number(b.isActive) - Number(a.isActive);
                break;
        }

        return sortDir === "asc" ? cmp : -cmp;
    });
}
