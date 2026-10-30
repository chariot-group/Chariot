import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionCharacterOptionAccessibleName } from "@/lib/sessionJoinCompanionVisibility";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/character";

interface CharacterSelectProps {
  characters: Character[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Pre-computed label for the selected character (useful when the selected character may not be in the list). */
  selectedLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  /** Linked NPC counts keyed by Player id. Zero / missing means no companion suffix. */
  companionCountByCharacterId?: Record<string, number>;
  /** Full count label, e.g. `2 compagnons` (shown from `sm` up). */
  formatCompanionCount?: (count: number) => string;
  /** Compact count label for narrow viewports, e.g. `×2`. */
  formatCompanionCountShort?: (count: number) => string;
}

function getCharacterItemLabel(character: Character): string {
  let label = character.firstname.trim();
  if (character.lastname) label += ` ${character.lastname.trim()}`;
  return label;
}

const CHARACTER_SELECT_TRIGGER_CLASS =
  "h-9 whitespace-normal border border-border/60 bg-card font-medium text-white shadow-xs hover:border-white/25 hover:bg-gray-middle-light data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/20 [&_svg]:opacity-80 [&_[data-slot=select-value]]:w-0 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:overflow-hidden [&_[data-slot=select-value]]:text-left";

function CharacterOptionRow({
  name,
  companionCount,
  fullCountLabel,
  shortCountLabel,
}: {
  name: string;
  companionCount: number;
  fullCountLabel: string;
  shortCountLabel: string;
}) {
  const showCount = companionCount > 0 && fullCountLabel.length > 0;

  return (
    <span className="flex w-full min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 flex-1 truncate text-left">{name}</span>
      {showCount ? (
        <>
          <span
            className="hidden shrink-0 text-xs font-normal text-white/55 sm:inline"
            aria-hidden="true">
            {fullCountLabel}
          </span>
          <span
            className="shrink-0 text-xs font-normal text-white/55 sm:hidden"
            aria-hidden="true">
            {shortCountLabel}
          </span>
        </>
      ) : null}
    </span>
  );
}

export function CharacterSelect({
  characters,
  value,
  onValueChange,
  placeholder,
  disabled,
  selectedLabel,
  triggerClassName,
  contentClassName,
  companionCountByCharacterId,
  formatCompanionCount,
  formatCompanionCountShort,
}: CharacterSelectProps) {
  const selectedCharacter = characters.find((character) => character._id === value);
  const selectedName =
    selectedLabel?.trim() || (selectedCharacter ? getCharacterItemLabel(selectedCharacter) : "");
  const selectedCompanionCount = value ? (companionCountByCharacterId?.[value] ?? 0) : 0;
  const selectedCompanionLabel =
    selectedCompanionCount > 0 && formatCompanionCount
      ? formatCompanionCount(selectedCompanionCount)
      : "";
  const selectedCompanionShortLabel =
    selectedCompanionCount > 0
      ? (formatCompanionCountShort?.(selectedCompanionCount) ?? selectedCompanionLabel)
      : "";

  return (
    <div className="w-full min-w-0">
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}>
        <SelectTrigger
          className={cn("w-full max-w-full min-w-0", CHARACTER_SELECT_TRIGGER_CLASS, triggerClassName)}>
          <SelectValue placeholder={placeholder}>
            {value && selectedName ? (
              <CharacterOptionRow
                name={selectedName}
                companionCount={selectedCompanionCount}
                fullCountLabel={selectedCompanionLabel}
                shortCountLabel={selectedCompanionShortLabel}
              />
            ) : (
              <span className="block w-full min-w-0 truncate text-left font-normal text-muted-foreground">
                {placeholder}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={4}
          className={cn(
            "max-h-60 max-w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]",
            contentClassName,
          )}>
          {characters.map((character) => {
            const label = getCharacterItemLabel(character);
            const companionCount = companionCountByCharacterId?.[character._id] ?? 0;
            const countLabel =
              companionCount > 0 && formatCompanionCount ? formatCompanionCount(companionCount) : "";
            const shortCountLabel =
              companionCount > 0
                ? (formatCompanionCountShort?.(companionCount) ?? countLabel)
                : "";
            const accessibleName = sessionCharacterOptionAccessibleName(label, companionCount, countLabel);

            return (
              <SelectItem
                key={character._id}
                value={character._id}
                title={accessibleName}
                textValue={accessibleName}
                className="py-2 pl-3 *:[span]:last:flex *:[span]:last:w-full *:[span]:last:min-w-0 *:[span]:last:items-stretch *:[span]:last:gap-0">
                <CharacterOptionRow
                  name={label}
                  companionCount={companionCount}
                  fullCountLabel={countLabel}
                  shortCountLabel={shortCountLabel}
                />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
