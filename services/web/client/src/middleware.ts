import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/request";

export default createMiddleware({
    // Locales supportées
    locales,

    // Locale par défaut
    defaultLocale,

    // Toujours afficher le préfixe de locale dans l'URL
    localePrefix: "always",
});

export const config = {
    // Matcher pour gérer toutes les routes sauf les fichiers statiques, _next et les API routes
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
