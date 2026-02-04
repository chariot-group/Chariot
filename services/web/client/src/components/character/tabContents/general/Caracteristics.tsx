import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";

interface CaracteristicsProps {
  character: Character;
  accentColor: string;
}

export default function Caracteristics({ character, accentColor }: CaracteristicsProps) {
  function calculateModifier(score: number): string {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  return (
    <Card className="gap-2 py-3">
      <h2 className={`text-2xl font-semibold ${accentColor}`}>Caractéristiques</h2>
      <div className="flex flex-col gap-0">
        {character?.stats &&
          Object.entries(character?.stats?.abilityScores).map(([key, value]) => (
            <p
              key={key}
              className="text-sm">
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value} ({calculateModifier(value)})
            </p>
          ))}
      </div>
    </Card>
  );
}
