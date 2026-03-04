"use client";

import { TabsContent } from "@/components/ui/tabs";
import CharacterInventoryTabContent from "@/components/character/tabContents/inventory/CharacterInventoryTabContent";
import CharacterHistoryTabContent from "@/components/character/tabContents/history/CharacterHistoryTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import CharacterMagicTabContent from "@/components/character/tabContents/magic/CharacterMagicTabContent";
import { CHARACTER_TABS, TAB_COLORS } from "@/components/character/CharacterTabs";
import { UseCharacterFormReturn } from "@/hooks/useCharacterForm";
import { NPC, Player } from "@/types/character";

interface CharacterTabPanelsProps {
  character: Player | NPC;
  form: UseCharacterFormReturn["form"];
  isEditing: boolean;
}

export default function CharacterTabPanels({ character, form, isEditing }: CharacterTabPanelsProps) {
  return (
    <>
      {CHARACTER_TABS.map((tab) => (
        <TabsContent
          key={tab}
          value={tab}
          className="mt-0 focus:outline-none"
          role="tabpanel"
          id={`${tab}-content`}
          aria-labelledby={tab}
          tabIndex={0}>
          {(() => {
            switch (tab) {
              case "general":
                return (
                  <CharacterGeneralTabContent
                    character={character}
                    accentColor={TAB_COLORS[tab]}
                    form={form}
                    isEditing={isEditing}
                  />
                );
              case "battle":
                return (
                  <CharacterBattleTabContent
                    character={character}
                    accentColor={TAB_COLORS[tab]}
                    form={form}
                    isEditing={isEditing}
                  />
                );
              case "magic":
                return (
                  <CharacterMagicTabContent
                    character={character}
                    accentColor={TAB_COLORS[tab]}
                    form={form}
                    isEditing={isEditing}
                  />
                );
              case "inventory":
                return (
                  <CharacterInventoryTabContent
                    character={character}
                    accentColor={TAB_COLORS[tab]}
                    form={form}
                    isEditing={isEditing}
                  />
                );
              case "history":
                return (
                  <CharacterHistoryTabContent
                    character={character}
                    accentColor={TAB_COLORS[tab]}
                    form={form}
                    isEditing={isEditing}
                  />
                );
              default:
                return null;
            }
          })()}
        </TabsContent>
      ))}
    </>
  );
}