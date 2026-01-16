import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, Locale } from "./i18n/request";
import { NextRequest } from "next/server";

// Function to get the preferred locale from cookies or headers
function getPreferredLocale(request: NextRequest): Locale | null {
    // 1. Check the locale preference cookie
    const cookieLocale = request.cookies.get("user-preferred-locale")?.value as Locale | undefined;
    if (cookieLocale && locales.includes(cookieLocale)) {
        return cookieLocale;
    }

    // 2. Check the browser's Accept-Language header
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
        const browserLocales = acceptLanguage
            .split(",")
            .map((lang) => lang.split(";")[0].trim().split("-")[0].toLowerCase());

        for (const lang of browserLocales) {
            if (locales.includes(lang as Locale)) {
                return lang as Locale;
            }
        }
    }

    return null;
}

const intlMiddleware = createMiddleware({
    // Supported locales
    locales,

    // Default locale
    defaultLocale,

    // Always display locale prefix in URL
    localePrefix: "always",

    // Custom function to determine default locale
    localeDetection: true,
});

export default function middleware(request: NextRequest) {
    // Get user's preferred locale
    const preferredLocale = getPreferredLocale(request);

    // If a preferred locale exists and the URL is root, redirect to that locale
    if (preferredLocale && request.nextUrl.pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = `/${preferredLocale}`;
        return Response.redirect(url);
    }

    // Call the standard next-intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Matcher to handle all routes except static files, _next and API routes
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
