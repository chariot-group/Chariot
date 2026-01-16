"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { detectBrowserLocale, saveStoredLocale, getStoredLocale } from "@/hooks/useLocalePreference";
import { Locale } from "@/i18n/request";

/**
 * Composant qui détecte et gère la locale préférée de l'utilisateur
 * Doit être placé dans le layout pour s'exécuter au chargement de chaque page
 */
export default function LocaleDetector() {
  const params = useParams();
  const router = useRouter();
  const currentLocale = params.locale as Locale;

  useEffect(() => {
    // Ne rien faire côté serveur
    if (typeof window === "undefined") return;

    // Vérifier si une locale est déjà sauvegardée
    let savedLocale = getStoredLocale();

    // Si aucune locale n'est sauvegardée, détecter celle du navigateur
    if (!savedLocale) {
      savedLocale = detectBrowserLocale();
      saveStoredLocale(savedLocale);
    }

    // Si la locale actuelle est différente de la locale préférée,
    // sauvegarder la locale actuelle comme nouvelle préférence
    if (currentLocale && currentLocale !== savedLocale) {
      saveStoredLocale(currentLocale);
    }
  }, [currentLocale]);

  // Ce composant ne rend rien
  return null;
}
