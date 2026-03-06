"use client";

import CharacterFormView from "@/components/character/CharacterFormView";

/**
 * Page for creating a new NPC character
 * Route: /campaigns/[idCampaign]/groups/[idGroup]/characters/new/npcs
 */
export default function CreateNpcPage() {
  return <CharacterFormView characterType="npcs" />;
}
