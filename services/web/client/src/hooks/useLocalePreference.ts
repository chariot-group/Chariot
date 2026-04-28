import { useState, useEffect } from "react";
import { Locale, locales, defaultLocale } from "@/i18n/request";

const LOCALE_STORAGE_KEY = "user-preferred-locale";

/**
 * Hook to manage the user's preferred locale
 * Saves to localStorage and cookie for middleware
 */
export function useLocalePreference() {
    const [preferredLocale, setPreferredLocale] = useState<Locale>(() => {
        if (typeof window === "undefined") return defaultLocale;

        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (savedLocale && locales.includes(savedLocale)) {
            return savedLocale;
        }

        return detectBrowserLocale();
    });

    useEffect(() => {
        localStorage.setItem(LOCALE_STORAGE_KEY, preferredLocale);
        setCookie(LOCALE_STORAGE_KEY, preferredLocale);
    }, [preferredLocale]);

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
 * Detects browser locale and returns a supported locale
 */
export function detectBrowserLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;

    // Get browser languages
    const browserLanguages = navigator.languages || [navigator.language];

    // Look for exact match (e.g.: "fr-FR" -> "fr")
    for (const lang of browserLanguages) {
        const shortLang = lang.split("-")[0].toLowerCase() as Locale;
        if (locales.includes(shortLang)) {
            return shortLang;
        }
    }

    // By default, return the default locale
    return defaultLocale;
}

/**
 * Gets preferred locale from localStorage (static function)
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
 * Saves preferred locale to localStorage and cookie (static function)
 */
export function saveStoredLocale(locale: Locale): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    setCookie(LOCALE_STORAGE_KEY, locale);
}

/**
 * Sets a cookie
 */
function setCookie(name: string, value: string, days: number = 365): void {
    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}
