import Resistances from "@/components/modules/characters/modals/panels/plus/sections/PlusResistancesSection";
import Immunities from "@/components/modules/characters/modals/panels/plus/sections/PlusImmunitiesSection";
import Vulnerabilities from "@/components/modules/characters/modals/panels/plus/sections/PlusVulnerabilitiesSection";
import Abilities from "@/components/modules/characters/modals/panels/plus/sections/PlusAbilitiesSection";
import ICharacter from "@/models/characters/ICharacter";

interface Props {
  character: ICharacter;
  isUpdate: boolean;
  updateCharacter: (character: ICharacter) => void;
}
export default function PlusSection({ character, isUpdate, updateCharacter }: Props) {
  return (
    <div className="flex flex-row gap-3 h-[90%] overflow-auto">
      <div className="flex flex-col gap-3 w-1/6 h-full">
        <Resistances
          isUpdate={isUpdate}
          updateCharacter={updateCharacter}
          character={character}
        />
        <Immunities
          isUpdate={isUpdate}
          updateCharacter={updateCharacter}
          character={character}
        />
        <Vulnerabilities
          isUpdate={isUpdate}
          updateCharacter={updateCharacter}
          character={character}
        />
      </div>
      <div className="flex flex-col border border-ring h-full"></div>
      <div className="flex flex-col gap-3 w-5/6 h-full">
        <Abilities
          isUpdate={isUpdate}
          updateCharacter={updateCharacter}
          character={character}
        />
      </div>
    </div>
  );
}
