import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

function getCharacterItemLabel(character: Character): string {
  let label = character.firstname.trim();
  if (character.lastname) label += ` ${character.lastname.trim()}`;
  return label;
}

export function CharacterSelect({
  characters,
  value,
  onValueChange,
  placeholder,
  disabled,
  selectedLabel,
  triggerClassName,
}: CharacterSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}>
      <SelectTrigger className={triggerClassName ?? "w-full"}>
        <SelectValue placeholder={placeholder}>{selectedLabel ?? undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {characters.map((character) => (
          <SelectItem
            key={character._id}
            value={character._id}>
            {getCharacterItemLabel(character)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
