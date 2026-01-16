import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Locales supportées par l'application
export const locales = ["fr", "en", "es"] as const;
export type Locale = (typeof locales)[number];

// Locale par défaut
export const defaultLocale: Locale = "fr";

export default getRequestConfig(async ({ requestLocale }) => {
    // Récupère la locale depuis les paramètres de requête
    const locale = await requestLocale;

    // Valide que la locale est supportée
    if (!locale || !locales.includes(locale as Locale)) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
