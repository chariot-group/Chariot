import { Card } from "@/components/ui/card";
import Image from "next/image";

import NoMastery from "@public/assets/mastery/no-mastery.svg";
import HalfMastery from "@public/assets/mastery/half-mastery.svg";
import Mastery from "@public/assets/mastery/mastery.svg";
import Expert from "@public/assets/mastery/expert.svg";

interface CompetenceProps {
  competence: string;
  value: number;
  icon: React.ReactElement;
  accentColor: string;
}

export default function Competence({ competence, value, icon, accentColor }: CompetenceProps) {
  function getIconForValue(value: number): string {
    switch (value) {
      case 1:
        return HalfMastery;
      case 2:
        return Mastery;
      case 3:
        return Expert;
      default:
        return NoMastery;
    }
  }

  return (
    <Card className="p-2">
      <p className={`text-sm flex items-center gap-2 ${value > 0 ? accentColor : ""}`}>
        {icon}
        {competence}
        <Image
          src={getIconForValue(value)}
          alt={`Niveau ${value}`}
          width={16}
          height={16}
        />
      </p>
    </Card>
  );
}
