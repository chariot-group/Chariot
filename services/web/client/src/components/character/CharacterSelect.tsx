import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

function getCharacterItemLabel(character: Character): string {
  let label = character.firstname.trim();
  if (character.lastname) label += ` ${character.lastname.trim()}`;
  return label;
}

const CHARACTER_SELECT_TRIGGER_CLASS =
  "border border-border/60 bg-card font-medium text-white shadow-xs hover:border-white/25 hover:bg-gray-middle-light data-[state=open]:border-primary/40 data-[state=open]:ring-2 data-[state=open]:ring-primary/20 [&_svg]:opacity-80";

export function CharacterSelect({
  characters,
  value,
  onValueChange,
  placeholder,
  disabled,
  selectedLabel,
  triggerClassName,
  contentClassName,
}: CharacterSelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}>
      <SelectTrigger className={cn("w-full", CHARACTER_SELECT_TRIGGER_CLASS, triggerClassName)}>
        <SelectValue placeholder={placeholder}>
          {selectedLabel && value ? selectedLabel : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        className={cn("max-h-60 min-w-[var(--radix-select-trigger-width)]", contentClassName)}>
        {characters.map((character) => {
          const label = getCharacterItemLabel(character);

          return (
            <SelectItem
              key={character._id}
              value={character._id}
              title={label}
              className="items-start whitespace-normal py-2.5 pl-3 leading-snug">
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
