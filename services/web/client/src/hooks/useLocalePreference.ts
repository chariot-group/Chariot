import { useState, useEffect } from "react";
import { Locale, locales, defaultLocale } from "@/i18n/request";

const LOCALE_STORAGE_KEY = "user-preferred-locale";

/**
 * Hook pour gérer la locale préférée de l'utilisateur
 * Sauvegarde dans localStorage et dans un cookie pour le middleware
 */
export function useLocalePreference() {
    const [preferredLocale, setPreferredLocale] = useState<Locale | null>(null);

    useEffect(() => {
        // Récupérer la locale sauvegardée ou détecter celle du navigateur
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;

        if (savedLocale && locales.includes(savedLocale)) {
            setPreferredLocale(savedLocale);
            // Synchroniser avec le cookie
            setCookie(LOCALE_STORAGE_KEY, savedLocale);
        } else {
            // Détecter la locale du navigateur
            const browserLocale = detectBrowserLocale();
            setPreferredLocale(browserLocale);
            localStorage.setItem(LOCALE_STORAGE_KEY, browserLocale);
            setCookie(LOCALE_STORAGE_KEY, browserLocale);
        }
    }, []);

    const saveLocalePreference = (locale: Locale) => {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        setCookie(LOCALE_STORAGE_KEY, locale);
        setPreferredLocale(locale);
    };

    const getLocalePreference = (): Locale => {
        if (typeof window === "undefined") return defaultLocale;

        const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (saved && locales.includes(saved)) {
            return saved;
        }
        return detectBrowserLocale();
    };

    return {
        preferredLocale,
        saveLocalePreference,
        getLocalePreference,
    };
}

/**
 * Détecte la locale du navigateur et retourne une locale supportée
 */
export function detectBrowserLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;

    // Récupérer les langues du navigateur
    const browserLanguages = navigator.languages || [navigator.language];

    // Chercher une correspondance exacte (ex: "fr-FR" -> "fr")
    for (const lang of browserLanguages) {
        const shortLang = lang.split("-")[0].toLowerCase() as Locale;
        if (locales.includes(shortLang)) {
            return shortLang;
        }
    }

    // Par défaut, retourner la locale par défaut
    return defaultLocale;
}

/**
 * Récupère la locale préférée depuis localStorage (fonction statique)
 */
export function getStoredLocale(): Locale | null {
    if (typeof window === "undefined") return null;

    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved && locales.includes(saved)) {
        return saved;
    }
    return null;
}

/**
 * Sauvegarde la locale préférée dans localStorage et cookie (fonction statique)
 */
export function saveStoredLocale(locale: Locale): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    setCookie(LOCALE_STORAGE_KEY, locale);
}

/**
 * Définit un cookie
 */
function setCookie(name: string, value: string, days: number = 365): void {
    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}
