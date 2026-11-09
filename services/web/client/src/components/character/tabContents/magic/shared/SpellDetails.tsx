import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Spell } from "@/types/character";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import { formatSignedBonus } from "@/utils/attack.utils";
import { formatDamageFormula, hydrateSpellDamageDetails } from "@/utils/spell-damage.utils";
import { cn } from "@/lib/utils";

interface SpellDetailsProps {
  spell: Spell;
  /** Spell attack bonus of the block, shown for attack spells. */
  attackBonus?: number | null;
  isNpc?: boolean;
  /** In-session cast controls, at the top of the details (the wide panel puts them on its heading line). */
  castControls?: ReactNode;
}

export interface SpellEffectLine {
  formula: string;
  type: string | null;
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Damage lines of a spell (structured entries, else the parsed legacy string): formula without
 * the type, and the type apart. Entries without dice are dropped.
 * @see FR-character-magic-list-card, FR-character-spell-multi-damage
 */
export function spellDamageLines(spell: Spell): SpellEffectLine[] {
  return hydrateSpellDamageDetails(spell.damageDetails, spell.damage).flatMap((entry) => {
    const formula = formatDamageFormula(entry.diceCount, entry.diceType, entry.bonus);
    const type = entry.damageType?.trim();
    return formula ? [{ formula, type: type ? capitalize(type) : null }] : [];
  });
}

/** Healing line of a spell (structured dice, else the raw healing text). */
export function spellHealingLine(spell: Spell): SpellEffectLine | null {
  const formula = spell.healingDetails
    ? formatDamageFormula(spell.healingDetails.diceCount, spell.healingDetails.diceType, spell.healingDetails.bonus)
    : spell.healing?.trim() || null;
  return formula ? { formula, type: null } : null;
}

/** Trait cell: label above, value below. */
const CELL_CLASS = "flex min-w-0 flex-col gap-0.5 rounded-[10px] bg-gray-middle-light/60 px-3 py-2";

/**
 * Cell width by kind. Short traits grow to fill their line (no holes, whatever is filled in);
 * long traits and effects take the full line.
 */
type CellSpan = "short" | "full";
const SPAN_CLASS: Record<CellSpan, string> = { short: "flex-1 basis-[8.5rem]", full: "basis-full" };

/** Damage or healing cell: entries side by side, wrapping when there are many. */
function EffectCell({ label, lines, span }: { label: string; lines: SpellEffectLine[]; span: CellSpan }) {
  return (
    <div className={cn(CELL_CLASS, SPAN_CLASS[span])}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-wrap gap-x-4 gap-y-1">
        {lines.map((line, index) => (
          <span
            key={index}
            className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums">{line.formula}</span>
            {line.type && (
              <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{line.type}</span>
            )}
          </span>
        ))}
      </dd>
    </div>
  );
}

/**
 * Spell details, read mode (expanded row or wide panel): in-session cast controls first (right-aligned),
 * then damage on a full line, short traits filling
 * their lines, then duration · components · healing on a line of their own, classes last, then
 * the description in its own section (no nested cards).
 * @see FR-character-magic-list-card
 */
export default function SpellDetails({ spell, attackBonus = null, isNpc = false, castControls }: SpellDetailsProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tClasses = useTranslations("classes");
  const tGeneral = useTranslations("characterDetail.player");
  const { convertRange } = useDistanceUnit();

  const damageLines = spellDamageLines(spell);
  const healingLine = spellHealingLine(spell);

  type Entry = [string, ReactNode, CellSpan];
  const isFilled = ([, value]: Entry) => value !== null && value !== undefined && value !== "";

  /** First lines: short traits growing to fill their lines. */
  const shortTraits = (
    [
      [
        tMagic("spellDetails.level"),
        spell.level === 0 ? tMagic("cantrips") : tMagic("spellLevelShort", { level: spell.level }),
        "short",
      ],
      [tMagic("spellDetails.school"), spell.school, "short"],
      [tMagic("spellDetails.castingTime"), spell.castingTime, "short"],
      [tMagic("spellDetails.range"), spell.range ? convertRange(spell.range) : "", "short"],
      [
        tMagic("attackBonus"),
        spell.effectType === "attack" && attackBonus !== null ? formatSignedBonus(Number(attackBonus)) : "",
        "short",
      ],
      [
        tMagic("spellDetails.usesTracker"),
        isNpc && spell.usesPerDay != null ? `${spell.used ?? 0} / ${spell.usesPerDay}` : "",
        "short",
      ],
    ] satisfies Entry[]
  ).filter(isFilled);

  /** Line of its own: duration and components (then healing, rendered apart). */
  const longTraits = (
    [
      [tMagic("spellDetails.duration"), spell.duration, "short"],
      [tMagic("spellDetails.components"), spell.components?.join(", "), "short"],
    ] satisfies Entry[]
  ).filter(isFilled);

  const classes = spell.classes?.map((c) => tClasses(c.charAt(0).toUpperCase() + c.slice(1))).join(", ");

  const renderCell = ([label, value, span]: Entry) => (
    <div
      key={label}
      className={cn(CELL_CLASS, SPAN_CLASS[span])}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="wrap-break-word text-sm font-semibold">{value}</dd>
    </div>
  );

  const hasFirstLines = damageLines.length > 0 || shortTraits.length > 0;
  const hasLastLines = longTraits.length > 0 || Boolean(healingLine) || Boolean(classes);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* `empty:hidden`: out of session the controls render nothing, so no gap is left above the traits */}
      {castControls && (
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 empty:hidden">{castControls}</div>
      )}
      {(hasFirstLines || hasLastLines) && (
        <div className="flex min-w-0 flex-col gap-2">
          {hasFirstLines && (
            <dl className="flex min-w-0 flex-wrap gap-2">
              {damageLines.length > 0 && (
                <EffectCell
                  label={tMagic("damage")}
                  lines={damageLines}
                  span="full"
                />
              )}
              {shortTraits.map(renderCell)}
            </dl>
          )}
          {hasLastLines && (
            <dl className="flex min-w-0 flex-wrap gap-2">
              {longTraits.map(renderCell)}
              {healingLine && (
                <EffectCell
                  label={tMagic("healing")}
                  lines={[healingLine]}
                  span="short"
                />
              )}
              {classes && renderCell([tGeneral("general.classes"), classes, "full"])}
            </dl>
          )}
        </div>
      )}
      {spell.description && (
        <div className="flex min-w-0 flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tMagic("spellDetails.description")}
          </p>
          <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{spell.description}</p>
        </div>
      )}
    </div>
  );
}
