import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale, Locale } from "./i18n/request";
import { NextRequest } from "next/server";

// Fonction pour obtenir la locale préférée depuis les cookies ou headers
function getPreferredLocale(request: NextRequest): Locale | null {
    // 1. Vérifier le cookie de préférence locale
    const cookieLocale = request.cookies.get("user-preferred-locale")?.value as Locale | undefined;
    if (cookieLocale && locales.includes(cookieLocale)) {
        return cookieLocale;
    }

    // 2. Vérifier l'en-tête Accept-Language du navigateur
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
    // Locales supportées
    locales,

    // Locale par défaut
    defaultLocale,

    // Toujours afficher le préfixe de locale dans l'URL
    localePrefix: "always",

    // Fonction personnalisée pour déterminer la locale par défaut
    localeDetection: true,
});

export default function middleware(request: NextRequest) {
    // Obtenir la locale préférée de l'utilisateur
    const preferredLocale = getPreferredLocale(request);

    // Si une locale préférée existe et que l'URL est la racine, rediriger vers cette locale
    if (preferredLocale && request.nextUrl.pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = `/${preferredLocale}`;
        return Response.redirect(url);
    }

    // Appeler le middleware next-intl standard
    return intlMiddleware(request);
}

export const config = {
    // Matcher pour gérer toutes les routes sauf les fichiers statiques, _next et les API routes
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
