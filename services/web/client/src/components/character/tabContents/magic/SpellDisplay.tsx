"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Spell } from "@/types/character";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDamageFormula } from "@/utils/spell-damage.utils";
import { formatSignedBonus } from "@/utils/attack.utils";

interface SpellDisplayProps {
  spell: Spell | null;
  accentColor: string;
  showTitle?: boolean;
  /** Contenu aligné à droite sur la même ligne que le titre (ex. actions de lancement en session) */
  titleEndContent?: ReactNode;
  attackBonus?: number | null;
  isNpc?: boolean;
  /** PJ à sorts préparés, sort de niveau ≥ 1 : pastille verte / grise dans l’en-tête */
  preparationStatusBadge?: "hidden" | "prepared" | "unprepared";
}

/**
 * Composant réutilisable pour afficher les détails d'un sort
 * Utilisé dans la vue des sorts et dans le dialog de sélection Codex
 */
export default function SpellDisplay({
  spell,
  accentColor,
  showTitle = true,
  titleEndContent,
  attackBonus = null,
  isNpc = false,
  preparationStatusBadge = "hidden",
}: SpellDisplayProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tClasses = useTranslations("classes");
  const tGeneral = useTranslations("characterDetail.player");

  if (!spell) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-400/60 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-50 [&::-webkit-scrollbar-thumb]:rounded-full">
      {showTitle && (
        <Card className="gap-3 py-4 px-4 md:px-6 flex-col">
          <div className="flex flex-row items-center justify-between gap-3 w-full min-w-0">
            <h3
              className={`${accentColor} text-lg sm:text-xl md:text-2xl font-semibold flex-1 min-w-0`}
              id="spell-name">
              {spell.name}
            </h3>
            <div className="shrink-0 flex flex-row items-center gap-2">
              {titleEndContent ? <div className="flex flex-col items-center">{titleEndContent}</div> : null}
              {preparationStatusBadge !== "hidden" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium cursor-default border",
                        preparationStatusBadge === "prepared"
                          ? "bg-emerald-600/88 text-white border-emerald-500/35"
                          : "border-foreground/15 bg-foreground/[0.06] text-muted-foreground",
                      )}>
                      {preparationStatusBadge === "prepared"
                        ? tMagic("spellPreparedLabel")
                        : tMagic("spellUnpreparedBadge")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {preparationStatusBadge === "prepared"
                        ? tMagic("spellPreparedStatusTooltip")
                        : tMagic("spellNotPreparedTooltip")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </Card>
      )}
      <div className="flex flex-wrap gap-2 items-start">
        {/* Level — NPC only */}
        {isNpc && spell.level != null && (
          <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
              {tMagic("spellDetails.level")}:
            </span>
            <span className="text-sm md:text-base wrap-break-word">
              {spell.level === 0 ? tMagic("cantrips") : tMagic("spellLevel", { level: spell.level })}
            </span>
          </Card>
        )}
        {/* Uses tracker — NPC only, limited-use spells */}
        {isNpc && spell.usesPerDay != null && (
          <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
              {tMagic("spellDetails.usesTracker")}:
            </span>
            <span className="text-sm md:text-base wrap-break-word font-semibold">
              {spell.used ?? 0} / {spell.usesPerDay}
            </span>
          </Card>
        )}
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
        {spell.classes && spell.classes.length > 0 && (
          <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
              {tGeneral("general.classes")}:
            </span>
            <span className="text-sm md:text-base wrap-break-word">
              {spell.classes.map((c) => tClasses(c.charAt(0).toUpperCase() + c.slice(1))).join(", ")}
            </span>
          </Card>
        )}
        {spell.effectType === "attack" && attackBonus !== null && (
          <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
            <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>
              {tMagic("attackBonus")}:
            </span>
            <span className="text-sm md:text-base wrap-break-word">{formatSignedBonus(attackBonus)}</span>
          </Card>
        )}
        {(() => {
          const damageFormula = spell.damageDetails
            ? formatDamageFormula(
                spell.damageDetails.diceCount,
                spell.damageDetails.diceType,
                spell.damageDetails.bonus,
                spell.damageDetails.damageType,
              )
            : spell.damage || null;

          return damageFormula ? (
            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
              <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{tMagic("damage")}:</span>
              <span className="text-sm md:text-base wrap-break-word">{damageFormula}</span>
            </Card>
          ) : null;
        })()}
        {(() => {
          const healingFormula = spell.healingDetails
            ? formatDamageFormula(
                spell.healingDetails.diceCount,
                spell.healingDetails.diceType,
                spell.healingDetails.bonus,
              )
            : spell.healing || null;

          return healingFormula ? (
            <Card className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 px-3 md:py-4 md:px-6">
              <span className={`${accentColor} font-semibold text-sm md:text-base shrink-0`}>{tMagic("healing")}:</span>
              <span className="text-sm md:text-base wrap-break-word">{healingFormula}</span>
            </Card>
          ) : null;
        })()}
        <Card className="flex flex-col gap-2 py-3 px-3 md:py-4 md:px-6 w-full">
          <span className={`${accentColor} font-semibold text-sm md:text-base`}>
            {tMagic("spellDetails.description")}:
          </span>
          <span className="text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
            {spell.description}
          </span>
        </Card>
      </div>
    </div>
  );
}
