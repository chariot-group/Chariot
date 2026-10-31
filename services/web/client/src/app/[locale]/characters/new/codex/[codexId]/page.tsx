"use client";

import CreateCharacterFromCodexView from "@/components/character/CreateCharacterFromCodexView";

/**
 * Player-space Codex create flow with a preselected entry (share link / QR code).
 * Route: /characters/new/codex/[codexId]?kind=player|monster&lang=fr|en|es
 * @see FR-codex-share-link-preselection
 */
export default function CreateCharacterFromCodexPreselectedPage() {
  return <CreateCharacterFromCodexView />;
}
