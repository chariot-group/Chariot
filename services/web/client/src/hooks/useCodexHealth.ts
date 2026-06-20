import { useEffect, useSyncExternalStore } from "react";
import {
  acquireCodexHealthSubscription,
  getCodexHealthSnapshot,
  releaseCodexHealthSubscription,
  subscribeToCodexHealth,
} from "@/lib/codexHealthStore";

/**
 * État de disponibilité Codex partagé entre tous les consommateurs.
 * Un seul polling actif pour l'application, avec cache entre montages.
 */
export function useCodexHealth() {
  useEffect(() => {
    acquireCodexHealthSubscription();
    return releaseCodexHealthSubscription;
  }, []);

  const { isAvailable, isChecking } = useSyncExternalStore(
    subscribeToCodexHealth,
    getCodexHealthSnapshot,
    getCodexHealthSnapshot,
  );

  return { isAvailable, isChecking };
}
