"use client";

import { Card } from "@/components/ui/card";
import { Spell } from "@/types/character";
import { useTranslations } from "next-intl";
import { formatDamageFormula } from "@/utils/spell-damage.utils";

interface SpellDisplayProps {
    spell: Spell | null;
    accentColor: string;
    showTitle?: boolean;
}

/**
 * Composant réutilisable pour afficher les détails d'un sort
 * Utilisé dans la vue des sorts et dans le dialog de sélection Codex
 */
export default function SpellDisplay({ spell, accentColor, showTitle = true }: SpellDisplayProps) {
    const tMagic = useTranslations("characterDetail.magic");

    if (!spell) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
            {showTitle && (
                <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
                    <h3
                        className={`${accentColor} text-lg sm:text-xl md:text-2xl font-semibold`}
                        id="spell-name">
                        {spell.name}
                    </h3>
                </Card>
            )}
            <div className="flex flex-wrap gap-2 items-start">
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.school")}:
                    </span>
                    <span className="text-sm md:text-base wrap-break-word">{spell.school}</span>
                </Card>
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.castingTime")}:
                    </span>
                    <span className="text-sm md:text-base wrap-break-word">{spell.castingTime}</span>
                </Card>
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.range")}:
                    </span>
                    <span className="text-sm md:text-base wrap-break-word">{spell.range}</span>
                </Card>
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.components")}:
                    </span>
                    <span className="text-sm md:text-base wrap-break-word">{spell.components?.join(", ")}</span>
                </Card>
                <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                    <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                        {tMagic("spellDetails.duration")}:
                    </span>
                    <span className="text-sm md:text-base wrap-break-word">{spell.duration}</span>
                </Card>
                {(() => {
                    const spellAny = spell as any;
                    const damageFormula = spellAny?.damageDetails
                        ? formatDamageFormula(
                            spellAny.damageDetails.diceCount,
                            spellAny.damageDetails.diceType,
                            spellAny.damageDetails.bonus,
                            spellAny.damageDetails.damageType
                        )
                        : spellAny?.damage || null;

                    return damageFormula ? (
                        <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                {tMagic("damage")}:
                            </span>
                            <span className="text-sm md:text-base wrap-break-word">{damageFormula}</span>
                        </Card>
                    ) : null;
                })()}
                {(() => {
                    const spellAny = spell as any;
                    const healingFormula = spellAny?.healingDetails
                        ? formatDamageFormula(
                            spellAny.healingDetails.diceCount,
                            spellAny.healingDetails.diceType,
                            spellAny.healingDetails.bonus
                        )
                        : spellAny?.healing || null;

                    return healingFormula ? (
                        <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
                            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
                                {tMagic("healing")}:
                            </span>
                            <span className="text-sm md:text-base wrap-break-word">{healingFormula}</span>
                        </Card>
                    ) : null;
                })()}
                <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
                    <span className={`${accentColor} font-semibold text-sm md:text-base`}>
                        {tMagic("spellDetails.description")}:
                    </span>
                    <span className="text-sm md:text-base leading-relaxed">{spell.description}</span>
                </Card>
            </div>
        </div>
    );
}
