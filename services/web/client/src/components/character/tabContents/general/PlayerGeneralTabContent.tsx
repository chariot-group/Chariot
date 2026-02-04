import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import { User2Icon } from "lucide-react";
import { useEffect } from "react";
import Competence from "./Competence";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

{
  /* Ajouter inspiration */
  /* Ajouter exhaustionLevel */
  /* Ajouter jet de sauvegarde */
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          {/* Personnage */}
          <Card className="gap-2 p-3">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Personnage</h2>
            <div className="flex flex-col">
              <p className="text-sm">
                <strong>Race :</strong> {player?.profile?.race}
              </p>
              <p className="text-sm">
                <strong> Niveau global:</strong> {player?.progression?.level ?? 0} (
                {player?.progression?.experience ?? 0} XP)
              </p>
              <p className="text-sm">
                <strong>Classe(s) :</strong> {player?.class.map((c) => c.name + " Niv " + c.level).join(" / ")}
              </p>
              {player?.class.map((c) => (
                <p
                  key={c.name}
                  className="text-sm">
                  <strong>Sous classe de {c.name} :</strong> {c.subclass}
                </p>
              ))}
            </div>
          </Card>
          {/* Maitrise */}
          <Card className="gap-2">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Maitrises</h2>
            <div className="flex flex-col gap-0">
              <p className="text-sm">
                <strong>Langue(s):</strong> {player?.stats?.languages.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Outil(s):</strong> {player?.stats?.tools.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Arme(s):</strong> {player?.stats?.weapons.join(", ")}
              </p>
              <p className="text-sm">
                <strong>Armure(s):</strong> {player?.stats?.armors.join(", ")}
              </p>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-2">
          <Card className="p-3 gap-0">
            <h2 className={`text-xl md:text-2xl font-semibold ${accentColor}`}>Compétences</h2>
            <span className="text-sm font-semibold">
              <strong>Bonus de maitrise:</strong> {player?.stats?.proficiencyBonus}
            </span>
          </Card>
          <div className="grid grid-cols-2 gap-1">
            {player?.stats?.masteries &&
              Object.entries(player.stats.masteries).map(([key, value]) => (
                <Competence
                  key={key}
                  competence={key}
                  value={value}
                  icon={<User2Icon />}
                  accentColor={accentColor}
                />
              ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* Alignement */}
          <Card className="gap-2 p-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Alignement</h2>
            <p className="font-semibold">{player?.profile?.alignment}</p>
          </Card>
          {/* Historique */}
          <Card className="gap-2 p-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Historique</h2>
            <p className="font-semibold">{player?.profile?.history}</p>
          </Card>
          <Card className="gap-2 md:gap-4">
            <h2 className={`text-xl md:text-2xl font-semibold ${accentColor}`}>Aptitudes</h2>
            <Accordion
              type="single"
              collapsible>
              {player?.abilities.map((ability) => (
                <AccordionItem
                  key={ability.name}
                  value={ability.name}>
                  <AccordionTrigger>{ability.name}</AccordionTrigger>
                  <AccordionContent className="">{ability.description}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
}
