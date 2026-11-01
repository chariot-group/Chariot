import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Spell } from "@/types/character";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { formatSignedBonus } from "@/utils/attack.utils";
import { formatDamageFormula, formatSpellDamageList } from "@/utils/spell-damage.utils";

interface SpellDetailsProps {
  spell: Spell;
  /** Spell attack bonus of the block, shown for attack spells. */
  attackBonus?: number | null;
  isNpc?: boolean;
  /** In-session cast controls, under the description. */
  castControls?: ReactNode;
}

/**
 * Expanded spell row, read mode: description, then a compact definition list (no nested cards).
 * @see FR-character-magic-list-card
 */
export default function SpellDetails({ spell, attackBonus = null, isNpc = false, castControls }: SpellDetailsProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tClasses = useTranslations("classes");
  const tGeneral = useTranslations("characterDetail.player");
  const { convertRange } = useDistanceUnit();

  const damage = formatSpellDamageList(spell.damageDetails, spell.damage);
  const healing = spell.healingDetails
    ? formatDamageFormula(spell.healingDetails.diceCount, spell.healingDetails.diceType, spell.healingDetails.bonus)
    : spell.healing || null;

  const entries: Array<[string, ReactNode]> = [
    [
      tMagic("spellDetails.level"),
      spell.level === 0 ? tMagic("cantrips") : tMagic("spellLevelShort", { level: spell.level }),
    ],
    [tMagic("spellDetails.school"), spell.school],
    [tMagic("spellDetails.castingTime"), spell.castingTime],
    [tMagic("spellDetails.range"), spell.range ? convertRange(spell.range) : ""],
    [tMagic("spellDetails.duration"), spell.duration],
    [tMagic("spellDetails.components"), spell.components?.join(", ")],
    [
      tGeneral("general.classes"),
      spell.classes?.map((c) => tClasses(c.charAt(0).toUpperCase() + c.slice(1))).join(", "),
    ],
    [
      tMagic("attackBonus"),
      spell.effectType === "attack" && attackBonus !== null ? formatSignedBonus(Number(attackBonus)) : "",
    ],
    [tMagic("damage"), damage],
    [tMagic("healing"), healing],
    [
      tMagic("spellDetails.usesTracker"),
      isNpc && spell.usesPerDay != null ? `${spell.used ?? 0} / ${spell.usesPerDay}` : "",
    ],
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {spell.description && <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{spell.description}</p>}
      <dl className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm">
        {entries
          .filter(([, value]) => value !== null && value !== undefined && value !== "")
          .map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 wrap-break-word">
              <dt className="inline text-muted-foreground">{label} :</dt>{" "}
              <dd className="inline font-medium">{value}</dd>
            </div>
          ))}
      </dl>
      {castControls && <div className="flex min-w-0 flex-wrap items-center gap-2">{castControls}</div>}
    </div>
  );
}
