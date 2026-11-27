"use client";

import { useParams } from "next/navigation";
import CharacterBuilderView from "@/components/characterBuilder/CharacterBuilderView";
import { buildCharacterBuilderRoutes } from "@/lib/characterBuilder/builderRoutes";

/**
 * Step-by-step Player builder in a campaign group.
 * Route: /campaigns/[idCampaign]/groups/[idGroup]/characters/new/builder
 * @see FR-ruleset-character-builder — Web builder UI
 */
export default function GroupCharacterBuilderPage() {
  const params = useParams<{ idCampaign: string; idGroup: string }>();
  return (
    <CharacterBuilderView
      key={params.idGroup}
      {...buildCharacterBuilderRoutes({ campaignId: params.idCampaign, groupId: params.idGroup })}
    />
  );
}
