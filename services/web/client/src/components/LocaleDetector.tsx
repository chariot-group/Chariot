"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { detectBrowserLocale, saveStoredLocale, getStoredLocale } from "@/hooks/useLocalePreference";
import { Locale } from "@/i18n/request";

/**
 * Component that detects and manages user's preferred locale
 * Should be placed in layout to run on each page load
 */
export default function LocaleDetector() {
  const params = useParams();
  const currentLocale = params.locale as Locale;

  useEffect(() => {
    // Do nothing server-side
    if (typeof window === "undefined") return;

    // Check if a locale is already saved
    let savedLocale = getStoredLocale();

    // If no locale is saved, detect from browser
    if (!savedLocale) {
      savedLocale = detectBrowserLocale();
      saveStoredLocale(savedLocale);
    }

    // If current locale is different from preferred locale,
    // save current locale as new preference
    if (currentLocale && currentLocale !== savedLocale) {
      saveStoredLocale(currentLocale);
    }
  }, [currentLocale]);

  // This component renders nothing
  return null;
}
