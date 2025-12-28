import ISpellcasting from "@/models/characters/spellcasting/ISpellcasting";
import { useState } from "react";
import SpellsCasting from "@/components/modules/characters/modals/panels/spells/sections/SpellCastingsSection";
import SpellCasting from "@/components/modules/characters/modals/panels/spells/sections/SpellCastingSection";
import ICharacter from "@/models/characters/ICharacter";

interface Props {
  character: ICharacter;
  isUpdate: boolean;
  updateCharacter: (player: ICharacter) => void;
}
export default function SpellsSection({ character, isUpdate, updateCharacter }: Props) {
  const [spellCastingSelected, setSpellCastingSelected] = useState<ISpellcasting>(character.spellcasting[0] || null);
  const [spellCastingIndex, setSpellCastingIndex] = useState<number>(0);

  const changeSpellCasting = (value: ISpellcasting) => {
    const newSpellcasting: ISpellcasting[] = [...spellcasting];
    newSpellcasting[spellCastingIndex] = value;
    changeSpellcastings(newSpellcasting);
  };

  const [spellcasting, setSpellcastings] = useState<ISpellcasting[]>(character.spellcasting);

  const changeSpellcastings = (value: ISpellcasting[]) => {
    setSpellcastings(value);
    setSpellCastingSelected(value[spellCastingIndex]);
    updateCharacter({
      ...character,
      spellcasting: value,
    });
  };

  return (
    <div className="flex flex-row gap-3 h-[90%] overflow-auto">
      <div className="flex flex-col gap-3 w-1/6 h-full">
        <SpellsCasting
          isUpdate={isUpdate}
          setSelectedSpellcasting={setSpellCastingSelected}
          selectedSpellcasting={spellCastingSelected}
          setSpellCastingIndex={setSpellCastingIndex}
          changeSpellcasting={changeSpellcastings}
          spellcasting={spellcasting}
        />
      </div>
      <div className="flex flex-col border border-ring h-full"></div>
      <div className="flex flex-col gap-3 w-5/6 h-full">
        {spellCastingSelected && (
          <SpellCasting
            isUpdate={isUpdate}
            selectedSpellcasting={spellCastingSelected}
            changeSpellCasting={changeSpellCasting}
          />
        )}
      </div>
    </div>
  );
}
