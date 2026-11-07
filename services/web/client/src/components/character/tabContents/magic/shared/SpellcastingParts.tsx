import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Book, CircleAlert, Dice5, Target, WandSparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KeyStat } from "@/components/character/tabContents/shared/StatsSummary";
import { formatSignedBonus } from "@/utils/attack.utils";

const ICON_CLASS = "size-4 shrink-0 text-muted-foreground sm:size-5";

interface SpellcastingSelectorProps {
  labels: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Extra control at the end of the group (e.g. « Add a class » in edit mode). */
  trailing?: ReactNode;
  /** Index of blocks containing invalid fields (error indicator next to the label). */
  invalidIndices?: ReadonlySet<number>;
  errorLabel?: string;
  className?: string;
}

/**
 * Segmented toggle between spellcasting blocks (active = primary white, inactive = secondary),
 * placed above the Spellcasting card.
 * @see FR-character-magic-list-card, FR-frontend-button-system
 */
export function SpellcastingSelector({
  labels,
  selectedIndex,
  onSelect,
  trailing,
  invalidIndices,
  errorLabel,
  className,
}: SpellcastingSelectorProps) {
  const tMagic = useTranslations("characterDetail.magic");

  return (
    <div
      className={cn("flex min-w-0 flex-wrap gap-2", className)}
      role="group"
      aria-label={tMagic("spellcastingClass")}>
      {labels.map((label, index) => {
        const isSelected = index === selectedIndex;
        const hasError = invalidIndices?.has(index) ?? false;
        return (
          <button
            key={index}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(index)}
            className={cn(
              buttonVariants({ variant: isSelected ? "primary" : "secondary", size: "sm" }),
              "max-w-full min-w-0",
            )}>
            <span className="truncate">{label}</span>
            {hasError && <MagicErrorIndicator label={errorLabel ?? ""} />}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}

interface SpellcastingStatsProps {
  abilityName: string;
  attackBonus: number | null | undefined;
  saveDC: number | null | undefined;
  /** Prepared count for classes that prepare spells, else omitted. */
  prepared?: { current: number; max: number } | null;
  className?: string;
}

/**
 * Key stats row of a spellcasting block (same cells as the statistics card).
 * @see FR-character-magic-list-card, FR-character-statistics-card
 */
export function SpellcastingStats({ abilityName, attackBonus, saveDC, prepared, className }: SpellcastingStatsProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const attackText = attackBonus === null || attackBonus === undefined ? "—" : formatSignedBonus(Number(attackBonus));
  const dcText = saveDC === null || saveDC === undefined ? "—" : String(saveDC);
  const preparedText = prepared ? tMagic("preparedSpellsUsage", { current: prepared.current, max: prepared.max }) : "";

  return (
    <div className={cn("grid min-w-0 gap-2", prepared ? "grid-cols-2 @sm:grid-cols-4" : "grid-cols-3", className)}>
      <KeyStat
        label={tMagic("abilityShort")}
        accessibleLabel={`${tMagic("spellcastingAbility")} ${abilityName || "—"}`}
        icon={<WandSparkles className={ICON_CLASS} />}
        value={abilityName || "—"}
      />
      <KeyStat
        label={tMagic("attackShort")}
        accessibleLabel={`${tMagic("attackBonus")} ${attackText}`}
        icon={<Target className={ICON_CLASS} />}
        value={attackText}
      />
      <KeyStat
        label={tMagic("saveDCShort")}
        accessibleLabel={`${tMagic("saveDC")} ${dcText}`}
        icon={<Dice5 className={ICON_CLASS} />}
        value={dcText}
      />
      {prepared && (
        <KeyStat
          label={tMagic("preparedShort")}
          accessibleLabel={`${tMagic("preparedSpells")} ${preparedText}`}
          icon={<Book className={ICON_CLASS} />}
          value={preparedText}
        />
      )}
    </div>
  );
}

/** Error icon with its text alternative (never color only). */
export function MagicErrorIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center text-red">
      <CircleAlert
        className="size-4"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Header of a level (or uses-per-day) group in the Spells list: tinted bar, sticky at the top of
 * the scroll area, with the group's slots on the right.
 * @see FR-character-magic-list-card
 */
export function SpellGroupHeader({
  label,
  accentColor,
  error,
  trailing,
}: {
  label: string;
  accentColor: string;
  error?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="sticky -top-0.5 z-10 bg-card pt-3 pb-1 first:pt-0">
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] bg-gray-middle-light px-3 py-1.5">
        <h3 className={cn("flex min-w-0 items-center gap-1.5 text-sm font-semibold sm:text-base", accentColor)}>
          <span className="truncate">{label}</span>
          {error}
        </h3>
        {trailing}
      </div>
    </div>
  );
}

/**
 * Castable slots of one level: pips (filled = remaining) and `remaining / total`.
 * @see FR-character-magic-list-card
 */
export function SpellSlotsBadge({ level, current, total }: { level: number; current: number; total: number }) {
  const tMagic = useTranslations("characterDetail.magic");
  const pips = total > 0 && total <= 9;

  return (
    <span
      className="flex shrink-0 items-center gap-2 text-sm"
      role="img"
      aria-label={tMagic("slotsRemainingAria", { level, current, total })}>
      {pips && (
        <span
          className="hidden items-center gap-1 @sm:flex"
          aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "size-2.5 rounded-full border border-white/40",
                index < current ? "border-transparent bg-white" : "bg-transparent",
              )}
            />
          ))}
        </span>
      )}
      <span
        className="font-semibold tabular-nums"
        aria-hidden="true">
        {tMagic("spellSlots", { current, total })}
      </span>
    </span>
  );
}
