"use client";

import CharacterBuilderView from "@/components/characterBuilder/CharacterBuilderView";
import { buildCharacterBuilderRoutes } from "@/lib/characterBuilder/builderRoutes";

/**
 * Step-by-step Player builder in Player space.
 * Route: /characters/new/builder
 * @see FR-ruleset-character-builder — Web builder UI
 */
export default function CharacterBuilderPage() {
  return <CharacterBuilderView {...buildCharacterBuilderRoutes()} />;
}
