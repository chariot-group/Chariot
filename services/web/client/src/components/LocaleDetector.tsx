"use client";

import { useEffect } from "react";
import { detectBrowserLocale, saveStoredLocale, getStoredLocale } from "@/hooks/useLocalePreference";

/**
 * Component that seeds browser locale into client storage on first visit.
 * Should be placed in layout to run on each page load.
 */
export default function LocaleDetector() {
  useEffect(() => {
    // Do nothing server-side
    if (typeof window === "undefined") return;

    // Seed client storage once when no preference exists yet
    if (!getStoredLocale()) {
      saveStoredLocale(detectBrowserLocale());
    }
  }, []);

  // This component renders nothing
  return null;
}
