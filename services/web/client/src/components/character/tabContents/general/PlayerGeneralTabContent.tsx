import { Card } from "@/components/ui/card";
import { Player } from "@/types/character";
import {
  Brain,
  Church,
  CircleQuestionMark,
  CrossIcon,
  Drama,
  Eye,
  Footprints,
  LockKeyhole,
  MessageSquare,
  MicVocal,
  Notebook,
  PawPrint,
  Sparkles,
  Sprout,
  Star,
  TreePine,
  User2Icon,
  VenetianMask,
} from "lucide-react";
import { useState } from "react";
import Competence from "./Competence";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Caracteristics from "./Caracteristics";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerGeneralTabContentProps {
  player: Player;
  accentColor: string;
}

export default function PlayerGeneralTabContent({ player, accentColor }: PlayerGeneralTabContentProps) {
  const [checked, setChecked] = useState<boolean>(player.inspiration);

  function infoExhaustionLevel(level: number): string {
    switch (level) {
      case 0:
        return "Aucun effet";
      case 1:
        return "Désavantage sur les jets de compétence";
      case 2:
        return "Vitesse réduite de moitié";
      case 3:
        return "Désavantage sur les jets d'attaque et de sauvegarde";
      case 4:
        return "Points de vie maximum réduits de moitié";
      case 5:
        return "Vitesse réduite à 0";
      default:
        return "Mort";
    }
  }

  function isMastered(competence: string): boolean {
    return player.stats.masteriesAbility[competence as keyof typeof player.stats.masteriesAbility] === true;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          {/* Personnage */}
          <Card className="gap-2 py-3">
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
          <Card className="gap-2 py-3">
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
          {/* Inspiration */}
          <Card className="gap-2 py-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Inspiration</h2>
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
              disabled
            />
          </Card>
          {/* Epuisement */}
          <Card className="gap-2 py-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Epuisement</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-semibold">{player.exhaustionLevel}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{infoExhaustionLevel(player.exhaustionLevel)}</p>
              </TooltipContent>
            </Tooltip>
          </Card>
          {/* Jet de sauvegarde */}
          <Card className="gap-2 py-3">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Jet de sauvegarde</h2>
            <div className="flex flex-col gap-0">
              {player?.stats &&
                Object.entries(player?.stats?.savingThrows).map(([key, value]) => (
                  <p
                    key={key}
                    className="text-sm">
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value >= 0 ? `+${value}` : value}
                    <Checkbox
                      checked={isMastered(key)}
                      disabled
                      className="ml-2"
                    />
                  </p>
                ))}
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-2">
          {/* Caractéristiques */}
          <Caracteristics
            character={player}
            accentColor={accentColor}
          />
          {/* Compétences */}
          <Card className="gap-0 py-3">
            <h2 className={`text-xl md:text-2xl font-semibold ${accentColor}`}>Compétences</h2>
            <span className="text-sm font-semibold">
              <strong>Bonus de maitrise:</strong> {player?.stats?.proficiencyBonus}
            </span>
          </Card>
          <div className="grid grid-cols-2 gap-1">
            <Competence
              competence={"Acrobaties"}
              value={player?.stats?.masteries.acrobatics}
              icon={<User2Icon />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Arcanes"}
              value={player?.stats?.masteries.arcana}
              icon={<Sparkles />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Athlétisme"}
              value={player?.stats?.masteries.athletics}
              icon={<Footprints />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.strength}
            />
            <Competence
              competence={"Discrétion"}
              value={player?.stats?.masteries.stealth}
              icon={<VenetianMask />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Dressage"}
              value={player?.stats?.masteries.animalHandling}
              icon={<PawPrint />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Escamotage"}
              value={player?.stats?.masteries.sleightHand}
              icon={<LockKeyhole />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Histoire"}
              value={player?.stats?.masteries.history}
              icon={<Notebook />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Intimidation"}
              value={player?.stats?.masteries.intimidation}
              icon={<User2Icon />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Intuition"}
              value={player?.stats?.masteries.insight}
              icon={<Brain />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Investigation"}
              value={player?.stats?.masteries.investigation}
              icon={<CircleQuestionMark />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Medecine"}
              value={player?.stats?.masteries.medicine}
              icon={<CrossIcon />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Nature"}
              value={player?.stats?.masteries.nature}
              icon={<Sprout />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Perception"}
              value={player?.stats?.masteries.perception}
              icon={<Eye />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Persuasion"}
              value={player?.stats?.masteries.persuasion}
              icon={<MessageSquare />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Religion"}
              value={player?.stats?.masteries.religion}
              icon={<Church />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Représentation"}
              value={player?.stats?.masteries.performance}
              icon={<MicVocal />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Survie"}
              value={player?.stats?.masteries.survival}
              icon={<TreePine />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Tromperie"}
              value={player?.stats?.masteries.deception}
              icon={<Drama />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* Alignement */}
          <Card className="gap-2 py-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Alignement</h2>
            <p className="font-semibold">{player?.profile?.alignment}</p>
          </Card>
          {/* Perception passive */}
          <Card className="gap-2 py-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Perception passive</h2>
            <p className="font-semibold">{player?.stats?.passivePerception}</p>
          </Card>
          {/* Historique */}
          <Card className="gap-2 py-3 flex-row items-center">
            <h2 className={`text-2xl font-semibold ${accentColor}`}>Historique</h2>
            <p className="font-semibold">{player?.profile?.history}</p>
          </Card>
          {/* Aptitudes */}
          <Card className="gap-2 py-3">
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
