"use client";

import { useTranslations } from "next-intl";
import { Player, NPC } from "@/types/character";
import { User } from "lucide-react";

interface CharacterHeaderProps {
    character: Player | NPC;
    accentColor: string;
}

function isPlayer(character: Player | NPC): character is Player {
    return "progression" in character;
}

export default function CharacterHeader({
    character,
    accentColor,
}: CharacterHeaderProps) {
    const t = useTranslations("characterDetail");

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Photo de profil placeholder */}
            <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shrink-0"
                style={{ borderColor: accentColor, borderWidth: "4px" }}
            >
                <User className="w-16 h-16 md:w-20 md:h-20 text-gray-middle-light" />
            </div>

            {/* Informations du personnage */}
            <div className="flex-1 space-y-4">
                {/* Nom */}
                <h1
                    className="text-4xl md:text-5xl font-bold"
                    style={{ color: accentColor }}
                >
                    {character.name}
                </h1>

                {/* Informations spécifiques selon le type */}
                <div className="space-y-2">
                    {isPlayer(character) ? (
                        <>
                            {/* Informations Player */}
                            <div className="flex flex-wrap gap-4 text-gray-light">
                                <div>
                                    <span className="font-semibold">
                                        {t("player.race")}:
                                    </span>{" "}
                                    <span style={{ color: accentColor }}>
                                        {character.profile.race}
                                        {character.profile.subrace &&
                                            ` (${character.profile.subrace})`}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        {t("player.alignment")}:
                                    </span>{" "}
                                    <span style={{ color: accentColor }}>
                                        {character.profile.alignment}
                                    </span>
                                </div>
                            </div>

                            {/* Classes et niveaux */}
                            <div className="flex flex-wrap gap-3">
                                {character.class.map((cls: { name: string; subclass?: string; level: number }, index: number) => (
                                    <div
                                        key={index}
                                        className="px-4 py-2 rounded-full bg-gray-middle-light/20"
                                        style={{
                                            borderColor: accentColor,
                                            borderWidth: "2px",
                                        }}
                                    >
                                        <span
                                            className="font-bold"
                                            style={{ color: accentColor }}
                                        >
                                            {cls.name}
                                        </span>
                                        {cls.subclass && (
                                            <span className="text-gray-light">
                                                {" "}
                                                ({cls.subclass})
                                            </span>
                                        )}{" "}
                                        <span className="text-white">
                                            {t("player.level")} {cls.level}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Informations NPC */}
                            <div className="flex flex-wrap gap-4 text-gray-light">
                                <div>
                                    <span className="font-semibold">
                                        {t("npc.type")}:
                                    </span>{" "}
                                    <span style={{ color: accentColor }}>
                                        {character.profile.type}
                                        {character.profile.subtype &&
                                            ` (${character.profile.subtype})`}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        {t("npc.alignment")}:
                                    </span>{" "}
                                    <span style={{ color: accentColor }}>
                                        {character.profile.alignment}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        {t("npc.challengeRating")}:
                                    </span>{" "}
                                    <span
                                        className="font-bold"
                                        style={{ color: accentColor }}
                                    >
                                        {character.challenge.challengeRating}
                                    </span>{" "}
                                    <span className="text-sm text-gray-middle-light">
                                        (
                                        {character.challenge.experiencePoints}{" "}
                                        XP)
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
