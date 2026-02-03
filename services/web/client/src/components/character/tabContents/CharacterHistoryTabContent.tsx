import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";
import { Cake, Eye, PersonStanding, Ruler, Scissors, Weight } from "lucide-react";

interface CharacterHistoryTabContentProps {
  character: Character;
  accentColor: string;
}

export default function CharacterHistoryTabContent({ character, accentColor }: CharacterHistoryTabContentProps) {
  return (
    <div className="w-full grid grid-cols-3 gap-2">
      <div className="flex flex-col gap-2">
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Apparence</h2>
          <div className="flex flex-col w-full gap-1">
            <div className="grid grid-cols-3">
              <span className="flex flex-row gap-2 text-sm items-center">
                <Eye className="text-muted-foreground" /> {character.appearance?.eyes}
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Cake className="text-muted-foreground" /> {character.appearance?.age}
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <PersonStanding className="text-muted-foreground" /> {character.appearance?.skin}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="flex flex-row gap-2 text-sm items-center">
                <Ruler className="text-muted-foreground" />{" "}
                <span>
                  {character.appearance?.height} ({character.stats?.size.charAt(0).toUpperCase()})
                </span>
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Weight className="text-muted-foreground" /> {character.appearance?.weight}
              </span>
              <span className="flex flex-row gap-2 text-sm items-center">
                <Scissors className="text-muted-foreground" /> {character.appearance?.hair}
              </span>
            </div>
          </div>
        </Card>
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Alliés et organisations</h2>
          <p>{character.background?.alliesAndOrgs}</p>
        </Card>
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Liens</h2>
          <p>{character.background?.bonds}</p>
        </Card>
      </div>
      <div className="flex flex-col gap-2">
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Description</h2>
          <p>{character.appearance?.description}</p>
        </Card>
      </div>
      <div className="flex flex-col gap-2">
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Traits de personnalité</h2>
          <p>{character.background.personalityTraits}</p>
        </Card>
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Idéaux</h2>
          <p>{character.background.ideals}</p>
        </Card>
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Défauts</h2>
          <p>{character.background.flaws}</p>
        </Card>
      </div>
      <div className="col-span-3">
        <Card className="gap-2">
          <h2 className={`${accentColor} text-2xl font-semibold`}>Histoire</h2>
          <p>{character.background.backstory}</p>
        </Card>
      </div>
    </div>
  );
}
