import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Supported application locales
export const locales = ["fr", "en", "es"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
    // Get locale from request parameters
    const locale = await requestLocale;

    // Validate that locale is supported
    if (!locale || !locales.includes(locale as Locale)) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
