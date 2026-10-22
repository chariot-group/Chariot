"use client";

import { TabsContent } from "@/components/ui/tabs";
import CharacterInventoryTabContent from "@/components/character/tabContents/inventory/CharacterInventoryTabContent";
import CharacterHistoryTabContent from "@/components/character/tabContents/history/CharacterHistoryTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import CharacterMagicTabContent from "@/components/character/tabContents/magic/CharacterMagicTabContent";
import CharacterCompanionsTabContent from "@/components/character/tabContents/companions/CharacterCompanionsTabContent";
import { tabsForCharacterSheet, TAB_COLORS, type CharacterTab } from "@/components/character/CharacterTabs";
import { UseCharacterFormReturn } from "@/hooks/useCharacterForm";
import { NPC, Player } from "@/types/character";
import { isPlayer } from "@/utils/global.utils";
import { useAppSelector } from "@/store/hooks";
import { selectContextMode } from "@/store/slices/environmentSlice";
import type { MutableRefObject } from "react";

interface CharacterTabPanelsProps {
    character: Player | NPC;
    form: UseCharacterFormReturn["form"];
    isEditing: boolean;
    onCharacterUpdate?: (updated?: Player | NPC) => void;
    onCompanionPendingChange?: (pending: boolean) => void;
    companionPersistRef?: MutableRefObject<(() => Promise<void>) | null>;
    companionRevertRef?: MutableRefObject<(() => void) | null>;
    /** @see FR-session-player-companion-combatants */
    showSessionGmCompanionsTab?: boolean;
    liaisonActionsEnabled?: boolean;
}

export default function CharacterTabPanels({
    character,
    form,
    isEditing,
    onCharacterUpdate,
    onCompanionPendingChange,
    companionPersistRef,
    companionRevertRef,
    showSessionGmCompanionsTab = false,
    liaisonActionsEnabled = true,
}: CharacterTabPanelsProps) {
    const contextMode = useAppSelector(selectContextMode);
    const tabs: readonly CharacterTab[] = tabsForCharacterSheet(
        isPlayer(character),
        contextMode === "player",
        showSessionGmCompanionsTab,
    );

    return (
        <>
            {tabs.map((tab) => (
                <TabsContent
                    key={tab}
                    value={tab}
                    className="mt-0 flex-none focus:outline-none"
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
                                        onCharacterUpdate={onCharacterUpdate}
                                    />
                                );
                            case "battle":
                                return (
                                    <CharacterBattleTabContent
                                        character={character}
                                        accentColor={TAB_COLORS[tab]}
                                        form={form}
                                        isEditing={isEditing}
                                        onCharacterUpdate={onCharacterUpdate}
                                    />
                                );
                            case "magic":
                                return (
                                    <div className="flex flex-col min-h-0 max-xl:max-h-none xl:h-[calc(100dvh-9.5rem)] 2xl:h-[calc(100dvh-8.75rem)] min-[1920px]:h-[calc(100dvh-8rem)] min-[2560px]:h-[calc(100dvh-7.5rem)]">
                                        <CharacterMagicTabContent
                                            character={character}
                                            accentColor={TAB_COLORS[tab]}
                                            form={form}
                                            isEditing={isEditing}
                                            onCharacterUpdate={onCharacterUpdate}
                                        />
                                    </div>
                                );
                            case "inventory":
                                return (
                                    <CharacterInventoryTabContent
                                        character={character}
                                        accentColor={TAB_COLORS[tab]}
                                        form={form}
                                        isEditing={isEditing}
                                        onCharacterUpdate={onCharacterUpdate}
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
                            case "companions":
                                return isPlayer(character) &&
                                    (contextMode === "player" || showSessionGmCompanionsTab) ? (
                                    <CharacterCompanionsTabContent
                                        player={character}
                                        isEditing={isEditing}
                                        liaisonActionsEnabled={liaisonActionsEnabled}
                                        onPendingChange={onCompanionPendingChange}
                                        persistRef={companionPersistRef}
                                        revertRef={companionRevertRef}
                                    />
                                ) : null;
                            default:
                                return null;
                        }
                    })()}
                </TabsContent>
            ))}
        </>
    );
}
