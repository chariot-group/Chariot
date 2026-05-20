import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCents(cents: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
    }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(date));
}

export function formatPercent(value: number): string {
    return `${value}%`;
}
