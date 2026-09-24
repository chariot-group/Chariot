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
  /** Linked NPC counts keyed by Player id. Zero / missing means no companion line. */
  companionCountByCharacterId?: Record<string, number>;
  /** Discreet count label, e.g. `2 compagnons`. Required to render the companion line. */
  formatCompanionCount?: (count: number) => string;
}

function getCharacterItemLabel(character: Character): string {
  let label = character.firstname.trim();
  if (character.lastname) label += ` ${character.lastname.trim()}`;
  return label;
}

const CHARACTER_SELECT_TRIGGER_CLASS =
  "h-auto min-h-9 border border-border/60 bg-card font-medium text-white shadow-xs hover:border-white/25 hover:bg-gray-middle-light data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/20 data-[size=default]:h-auto data-[size=default]:min-h-9 [&_svg]:opacity-80 [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:overflow-hidden";

function CompanionCountLine({ label }: { label: string }) {
  return <span className="w-full truncate text-xs font-normal text-white/55">{label}</span>;
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
}: CharacterSelectProps) {
  const selectedCharacter = characters.find((character) => character._id === value);
  const selectedName =
    selectedLabel?.trim() || (selectedCharacter ? getCharacterItemLabel(selectedCharacter) : "");
  const selectedCompanionCount = value ? (companionCountByCharacterId?.[value] ?? 0) : 0;
  const selectedCompanionLabel =
    selectedCompanionCount > 0 && formatCompanionCount
      ? formatCompanionCount(selectedCompanionCount)
      : "";

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}>
      <SelectTrigger className={cn("w-full", CHARACTER_SELECT_TRIGGER_CLASS, triggerClassName)}>
        <SelectValue placeholder={placeholder}>
          {value && selectedName ? (
            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
              <span className="w-full truncate">{selectedName}</span>
              {selectedCompanionCount > 0 && selectedCompanionLabel ? (
                <CompanionCountLine label={selectedCompanionLabel} />
              ) : null}
            </span>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={4}
        className={cn("max-h-60 min-w-[var(--radix-select-trigger-width)]", contentClassName)}>
        {characters.map((character) => {
          const label = getCharacterItemLabel(character);
          const companionCount = companionCountByCharacterId?.[character._id] ?? 0;
          const countLabel =
            companionCount > 0 && formatCompanionCount ? formatCompanionCount(companionCount) : "";
          const accessibleName = sessionCharacterOptionAccessibleName(label, companionCount, countLabel);

          return (
            <SelectItem
              key={character._id}
              value={character._id}
              title={accessibleName}
              textValue={accessibleName}
              className="items-start whitespace-normal py-2.5 pl-3 leading-snug *:[span]:last:items-start *:[span]:last:flex-col">
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="w-full truncate">{label}</span>
                {companionCount > 0 && countLabel ? <CompanionCountLine label={countLabel} /> : null}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
