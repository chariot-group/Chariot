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
    <div
      className="w-full flex flex-col gap-2 px-2 sm:px-0"
      role="main"
      aria-label="Informations générales du personnage">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {/* Colonne 1 : Personnage et Maitrises */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="character-info-section">
          {/* Personnage */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-heading">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Personnage
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">Race :</dt>
                <dd className="text-sm sm:text-base">{player?.profile?.race}</dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">Niveau global :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.progression?.level ?? 0} ({player?.progression?.experience ?? 0} XP)
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">Classe(s) :</dt>
                <dd className="text-sm sm:text-base">
                  {player?.class.map((c) => `${c.name} Niv ${c.level}`).join(" / ")}
                </dd>
              </div>
              {player?.class.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-col sm:flex-row gap-2">
                  <dt className="text-sm sm:text-base font-semibold">Sous classe de {c.name} :</dt>
                  <dd className="text-sm sm:text-base">{c.subclass}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Maitrise */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="proficiencies-heading">
            <h2
              id="proficiencies-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Maitrises
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">Langue(s) :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.languages.join(", ") || "Aucune"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">Outil(s) :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.tools.join(", ") || "Aucun"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">Arme(s) :</dt>
                <dd className="text-sm sm:text-base wrap-break-words">
                  {player?.stats?.weapons.join(", ") || "Aucune"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm sm:text-base font-semibold">Armure(s) :</dt>
                <dd className="text-sm sm:text-base">{player?.stats?.armors.join(", ") || "Aucune"}</dd>
              </div>
            </dl>
          </Card>

          {/* Inspiration */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="inspiration-heading">
            <h2
              id="inspiration-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Inspiration
            </h2>
            <div className="flex items-center gap-2">
              <Checkbox
                id="inspiration-checkbox"
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
                disabled
                aria-label={`Inspiration ${checked ? "active" : "inactive"}`}
                aria-describedby="inspiration-heading"
              />
              <label
                htmlFor="inspiration-checkbox"
                className="sr-only">
                État d'inspiration
              </label>
            </div>
          </Card>

          {/* Epuisement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="exhaustion-heading">
            <h2
              id="exhaustion-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Épuisement
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-2"
                  aria-label={`Niveau d'épuisement ${player.exhaustionLevel}`}
                  aria-describedby="exhaustion-description">
                  {player.exhaustionLevel}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p id="exhaustion-description">{infoExhaustionLevel(player.exhaustionLevel)}</p>
              </TooltipContent>
            </Tooltip>
          </Card>

          {/* Jet de sauvegarde */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="saving-throws-heading">
            <h2
              id="saving-throws-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Jets de sauvegarde
            </h2>
            <dl
              className="flex flex-col gap-2"
              role="list">
              {player?.stats &&
                Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                  const isMasteredKey = isMastered(key);
                  const abilityName = key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2"
                      role="listitem">
                      <div className="flex items-center gap-2 flex-1">
                        <dt className="text-sm sm:text-base font-semibold">{abilityName} :</dt>
                        <dd className="text-sm sm:text-base">{value >= 0 ? `+${value}` : value}</dd>
                      </div>
                      <Checkbox
                        id={`mastery-${key}`}
                        checked={isMasteredKey}
                        disabled
                        aria-label={`Maîtrise de ${abilityName} ${isMasteredKey ? "active" : "inactive"}`}
                      />
                      <label
                        htmlFor={`mastery-${key}`}
                        className="sr-only">
                        Maîtrise {abilityName}
                      </label>
                    </div>
                  );
                })}
            </dl>
          </Card>
        </section>

        {/* Colonne 2 : Caractéristiques et Compétences */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="characteristics-skills-section">
          {/* Caractéristiques */}
          <Caracteristics
            character={player}
            accentColor={accentColor}
          />

          {/* Compétences */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="skills-heading">
            <h2
              id="skills-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Compétences
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold">Bonus de maîtrise :</span>
                <span
                  className="text-sm sm:text-base"
                  aria-label={`Bonus de maîtrise ${player?.stats?.proficiencyBonus}`}>
                  {player?.stats?.proficiencyBonus}
                </span>
              </div>
            </div>
          </Card>

          <div
            className="grid grid-cols-1 xl:grid-cols-2 gap-2"
            role="list"
            aria-label="Liste des compétences du personnage">
            <Competence
              competence={"Acrobaties"}
              value={player?.stats?.masteries.acrobatics}
              icon={<User2Icon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Arcanes"}
              value={player?.stats?.masteries.arcana}
              icon={<Sparkles aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Athlétisme"}
              value={player?.stats?.masteries.athletics}
              icon={<Footprints aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.strength}
            />
            <Competence
              competence={"Discrétion"}
              value={player?.stats?.masteries.stealth}
              icon={<VenetianMask aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Dressage"}
              value={player?.stats?.masteries.animalHandling}
              icon={<PawPrint aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Escamotage"}
              value={player?.stats?.masteries.sleightHand}
              icon={<LockKeyhole aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.dexterity}
            />
            <Competence
              competence={"Histoire"}
              value={player?.stats?.masteries.history}
              icon={<Notebook aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Intimidation"}
              value={player?.stats?.masteries.intimidation}
              icon={<User2Icon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Intuition"}
              value={player?.stats?.masteries.insight}
              icon={<Brain aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Investigation"}
              value={player?.stats?.masteries.investigation}
              icon={<CircleQuestionMark aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Médecine"}
              value={player?.stats?.masteries.medicine}
              icon={<CrossIcon aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Nature"}
              value={player?.stats?.masteries.nature}
              icon={<Sprout aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Perception"}
              value={player?.stats?.masteries.perception}
              icon={<Eye aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Persuasion"}
              value={player?.stats?.masteries.persuasion}
              icon={<MessageSquare aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Religion"}
              value={player?.stats?.masteries.religion}
              icon={<Church aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.intelligence}
            />
            <Competence
              competence={"Représentation"}
              value={player?.stats?.masteries.performance}
              icon={<MicVocal aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
            <Competence
              competence={"Survie"}
              value={player?.stats?.masteries.survival}
              icon={<TreePine aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.wisdom}
            />
            <Competence
              competence={"Tromperie"}
              value={player?.stats?.masteries.deception}
              icon={<Drama aria-hidden="true" />}
              accentColor={accentColor}
              proficiencyBonus={player?.stats?.proficiencyBonus}
              masteriesAbility={player?.stats?.abilityScores.charisma}
            />
          </div>
        </section>

        {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
        <section
          className="flex flex-col gap-2"
          aria-labelledby="additional-info-section">
          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="alignment-heading">
            <h2
              id="alignment-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Alignement
            </h2>
            <p
              className="font-semibold text-sm sm:text-base"
              aria-label={`Alignement du personnage : ${player?.profile?.alignment}`}>
              {player?.profile?.alignment}
            </p>
          </Card>

          {/* Perception passive */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="passive-perception-heading">
            <h2
              id="passive-perception-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Perception passive
            </h2>
            <p
              className="font-semibold text-lg sm:text-xl"
              aria-label={`Perception passive : ${player?.stats?.passivePerception}`}>
              {player?.stats?.passivePerception}
            </p>
          </Card>

          {/* Historique */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="background-heading">
            <h2
              id="background-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Historique
            </h2>
            <p
              className="font-semibold text-sm sm:text-base text-right"
              aria-label={`Historique du personnage : ${player?.profile?.history}`}>
              {player?.profile?.history}
            </p>
          </Card>

          {/* Aptitudes */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="abilities-heading">
            <h2
              id="abilities-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              Aptitudes
            </h2>
            <Accordion
              type="single"
              collapsible
              className="w-full">
              {player?.abilities.map((ability, index) => (
                <AccordionItem
                  key={ability.name}
                  value={ability.name}>
                  <AccordionTrigger
                    className="text-left hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded py-3"
                    aria-label={`Détails de l'aptitude ${ability.name}`}>
                    <span className="text-sm sm:text-base font-medium">{ability.name}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-sm sm:text-base pb-3 pt-1"
                    role="region"
                    aria-label={`Description de ${ability.name}`}>
                    {ability.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>
      </div>
    </div>
  );
}
