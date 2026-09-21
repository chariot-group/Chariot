"use client";

import CharacterFormView from "@/components/character/CharacterFormView";

/**
 * Player-space NPC creation (optional ?linkedPlayerId=).
 * @see FR-npc-player-link
 */
export default function CreateNpcWithoutGroupPage() {
  return <CharacterFormView characterType="npcs" />;
}
