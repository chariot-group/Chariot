"use client";

import CharacterFormView from "@/components/character/CharacterFormView";

/**
 * Page for creating a new Player character
 * Route: /campaigns/[idCampaign]/groups/[idGroup]/characters/new/players
 */
export default function CreatePlayerPage() {
  return <CharacterFormView characterType="players" />;
}
