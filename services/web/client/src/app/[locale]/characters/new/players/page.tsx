"use client";

import CharacterFormView from "@/components/character/CharacterFormView";

/**
 * Page for creating a new Player character without group/campaign context
 * Route: /characters/new/players
 */
export default function CreatePlayerPage() {
  return <CharacterFormView characterType="players" />;
}
