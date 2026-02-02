"use client";

import { User } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContentPlaceholder from "./TabContentPlaceholder";
import { useState } from "react";

export type CharacterTab = "general" | "combat" | "magic" | "inventory" | "history";

const TAB_COLORS: Record<CharacterTab, { bg: string; text: string }> = {
    general: { bg: "bg-blue", text: "blue" },
    combat: { bg: "bg-red", text: "red" },
    magic: { bg: "bg-pink", text: "pink" },
    inventory: { bg: "bg-yellow", text: "yellow" },
    history: { bg: "bg-green", text: "green" },
};

function isPlayer(character: Player | NPC): character is Player {
    return "progression" in character;
}

interface CharacterDetailViewProps {
    character: Player | NPC;
}

export default function CharacterDetailView({ character }: CharacterDetailViewProps) {
    const t = useTranslations("characterDetail");
    const [activeTab, setActiveTab] = useState<CharacterTab>("general");

    return (
        <div className="min-h-screen">
            <Tabs
                defaultValue="general"
                value={activeTab}
                onValueChange={(value: string) => setActiveTab(value as CharacterTab)}
                className="w-full"
            >
                {/* Header avec onglets et infos du personnage */}
                <div>
                    <div className="max-w-480 mx-auto px-8 py-4">
                        <div className="flex items-end justify-between gap-8">
                            {/* Onglets à gauche */}
                            <TabsList className="bg-transparent gap-4">
                                {(["general", "combat", "magic", "inventory", "history"] as CharacterTab[]).map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className={`
                                            px-5 py-4 text-base font-medium rounded-[13px] transition-all 
                                            ${activeTab === tab
                                                ? `${TAB_COLORS[tab].bg} ${tab === 'combat' ? 'text-white' : 'text-black'}`
                                                : `text-white bg-gray`
                                            }
                                        `}
                                    >
                                        {t(`tabs.${tab}`)}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* Infos du personnage à droite */}
                            <div className="flex items-end gap-5 shrink-0">
                                <div className="text-right mb-2">
                                    <h1 className="text-3xl font-bold text-white">
                                        {character.name}
                                    </h1>
                                    {isPlayer(character) ? (
                                        <>
                                            <p className="text-base text-white font-semibold">
                                                {character.class.map((cls: { name: string; level: number }, index: number) => (
                                                    <span key={index}>
                                                        {cls.name} Niv {cls.level}
                                                        {index < character.class.length - 1 && " / "}
                                                    </span>
                                                ))}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-base text-white font-semibold">
                                                CR {
                                                    character.challenge.challengeRating < 1
                                                        ? character.challenge.challengeRating === 0.125 ? "1/8"
                                                            : character.challenge.challengeRating === 0.25 ? "1/4"
                                                                : character.challenge.challengeRating === 0.5 ? "1/2"
                                                                    : character.challenge.challengeRating
                                                        : character.challenge.challengeRating
                                                } ({character.challenge.experiencePoints} XP)
                                            </p>
                                        </>
                                    )}
                                    {character.groups && character.groups.length > 0 && (
                                        <p className="text-sm text-white">
                                            Groupe : {character.groups[0].label}
                                        </p>
                                    )}
                                </div>

                                {/* Photo de profil */}
                                <div className="w-[7vw] h-[9vh] rounded-[18px] bg-gray flex items-center justify-center overflow-hidden shrink-0">
                                    <User className="w-12 h-12 text-gray-middle-light" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu des onglets */}
                <div className="max-w-480 mx-auto px-8 py-8">
                    {(["general", "combat", "magic", "inventory", "history"] as CharacterTab[]).map((tab) => (
                        <TabsContent key={tab} value={tab} className="mt-0">
                            <TabContentPlaceholder tab={tab} accentColor={TAB_COLORS[tab].text} />
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    );
}
