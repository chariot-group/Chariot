"use client";

import { useSessionBattleSync } from "@/hooks/useSessionBattleSync";
import { useLastConsultedSheetTracking } from "@/hooks/useLastConsultedSheetTracking";

/**
 * FR-session-combat-navigation — pont client pour la synchro combat et le suivi de la dernière fiche MJ.
 */
export default function SessionBattleSyncClient() {
  useSessionBattleSync();
  useLastConsultedSheetTracking();
  return null;
}
