import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import {
  Brain,
  Church,
  CircleQuestionMark,
  CrossIcon,
  Drama,
  Eye,
  Footprints,
  ListChevronsDownUp,
  ListChevronsUpDown,
  LockKeyhole,
  MessageSquare,
  MicVocal,
  Notebook,
  PawPrint,
  Sparkles,
  Sprout,
  TreePine,
  User2Icon,
  VenetianMask,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AbilityScores from "@/components/character/tabContents/general/AbilityScores";
import { calculateAbilityBonus } from "@/utils/global.utils";
import Skill from "@/components/character/tabContents/general/Skill";
import { useState } from "react";

interface NpcGeneralTabContentProps {
  npc: NPC;
  accentColor: string;
}

export default function NpcGeneralTabContent({ npc, accentColor }: NpcGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tNpc = useTranslations("characterDetail.npc");
  const tAlignment = useTranslations("alignments");
  const tMagic = useTranslations("characterDetail.magic");

  const [openAccordionValues, setOpenAccordionValues] = useState<string[]>([]);

  return (
    <div
      className="w-full flex flex-col gap-2 px-2 sm:px-0"
      role="main"
      aria-label={tNpc("general.npcInfoLabel")}>
      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Colonne 1 : Personnage et Maitrises */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="character-info-section"
          aria-label={tNpc("general.characterInfo")}>
          {/* Personnage */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-heading">
            <h2
              id="character-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <dt className="text-sm sm:text-base font-semibold">{tNpc("typeLabel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {npc?.profile?.type} {npc?.profile?.subtype?.length > 0 && `(${npc?.profile?.subtype})`}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Caractéristiques */}
          <AbilityScores
            character={npc}
            accentColor={accentColor}
          />

          {/* Maitrise */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="languages-heading">
            <h2
              id="languages-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("languages")}
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex flex-col">
                <dd
                  className="text-sm sm:text-base"
                  aria-label={`${t("languages")} : ${npc?.stats?.languages?.length > 0 ? npc.stats.languages.join(", ") : t("noLanguages")}`}>
                  {npc?.stats?.languages?.length > 0 ? npc.stats.languages.join(", ") : t("noLanguages")}
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        {/* Colonne 2 : Caractéristiques et Compétences */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="characteristics-skills-section"
          aria-label={tNpc("general.characteristicsSkills")}>
          {/* Jet de sauvegarde */}
          <div className="flex flex-col gap-2">
            <Card
              className="gap-3 py-4 px-4 md:px-6"
              role="region"
              aria-labelledby="saving-throws-heading">
              <h2
                id="saving-throws-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("savingThrows")}
              </h2>
            </Card>
            <div
              className="grid grid-cols-1 xl:grid-cols-2 gap-2"
              role="list">
              {npc?.stats &&
                Object.entries(npc?.stats?.savingThrows).map(([key, value]) => {
                  const abilityName = t(`abilities.${key}`);
                  const abilityScore = npc?.stats?.abilityScores[key as keyof typeof npc.stats.abilityScores] || 0;
                  return (
                    <Skill
                      key={key}
                      skillName={abilityName}
                      value={value > 0 ? 2 : 0}
                      accentColor={accentColor}
                      skills={value > 0 ? value : calculateAbilityBonus(abilityScore)}
                    />
                  );
                })}
            </div>
          </div>

          {/* Compétences */}
          <div className="flex flex-col gap-2">
            <Card
              className="gap-3 py-4 px-4 md:px-6"
              role="region"
              aria-labelledby="skills-heading">
              <h2
                id="skills-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("skills")}
              </h2>
            </Card>
            <div
              className="grid grid-cols-1 xl:grid-cols-2 gap-2"
              role="list"
              aria-label={t("skillsList")}>
              <Skill
                skillName={t("skillNames.acrobatics")}
                value={npc?.stats?.skills?.acrobatics > 0 ? 2 : 0}
                icon={<User2Icon aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.dexterity}
                skills={
                  npc?.stats?.skills?.acrobatics > 0
                    ? npc?.stats?.skills?.acrobatics
                    : calculateAbilityBonus(npc?.stats?.abilityScores.dexterity)
                }
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.arcana")}
                value={npc?.stats?.skills?.arcana > 0 ? 2 : 0}
                icon={<Sparkles aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.intelligence}
                skills={
                  npc?.stats?.skills?.arcana > 0
                    ? npc?.stats?.skills?.arcana
                    : calculateAbilityBonus(npc?.stats?.abilityScores.intelligence)
                }
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.athletics")}
                value={npc?.stats?.skills?.athletics > 0 ? 2 : 0}
                icon={<Footprints aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.strength}
                skills={
                  npc?.stats?.skills?.athletics > 0
                    ? npc?.stats?.skills?.athletics
                    : calculateAbilityBonus(npc?.stats?.abilityScores.strength)
                }
                tooltip={t("abilities.strength")}
              />
              <Skill
                skillName={t("skillNames.stealth")}
                value={npc?.stats?.skills?.stealth > 0 ? 2 : 0}
                icon={<VenetianMask aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.dexterity}
                skills={
                  npc?.stats?.skills?.stealth > 0
                    ? npc?.stats?.skills?.stealth
                    : calculateAbilityBonus(npc?.stats?.abilityScores.dexterity)
                }
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.animalHandling")}
                value={npc?.stats?.skills?.animalHandling > 0 ? 2 : 0}
                icon={<PawPrint aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.wisdom}
                skills={
                  npc?.stats?.skills?.animalHandling > 0
                    ? npc?.stats?.skills?.animalHandling
                    : calculateAbilityBonus(npc?.stats?.abilityScores.wisdom)
                }
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.sleightHand")}
                value={npc?.stats?.skills?.sleightHand > 0 ? 2 : 0}
                icon={<LockKeyhole aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.dexterity}
                skills={
                  npc?.stats?.skills?.sleightHand > 0
                    ? npc?.stats?.skills?.sleightHand
                    : calculateAbilityBonus(npc?.stats?.abilityScores.dexterity)
                }
                tooltip={t("abilities.dexterity")}
              />
              <Skill
                skillName={t("skillNames.history")}
                value={npc?.stats?.skills?.history > 0 ? 2 : 0}
                icon={<Notebook aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.intelligence}
                skills={
                  npc?.stats?.skills?.history > 0
                    ? npc?.stats?.skills?.history
                    : calculateAbilityBonus(npc?.stats?.abilityScores.intelligence)
                }
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.intimidation")}
                value={npc?.stats?.skills?.intimidation > 0 ? 2 : 0}
                icon={<User2Icon aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.charisma}
                skills={
                  npc?.stats?.skills?.intimidation > 0
                    ? npc?.stats?.skills?.intimidation
                    : calculateAbilityBonus(npc?.stats?.abilityScores.charisma)
                }
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.insight")}
                value={npc?.stats?.skills?.insight > 0 ? 2 : 0}
                icon={<Brain aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.wisdom}
                skills={
                  npc?.stats?.skills?.insight > 0
                    ? npc?.stats?.skills?.insight
                    : calculateAbilityBonus(npc?.stats?.abilityScores.wisdom)
                }
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.investigation")}
                value={npc?.stats?.skills?.investigation > 0 ? 2 : 0}
                icon={<CircleQuestionMark aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.intelligence}
                skills={
                  npc?.stats?.skills?.investigation > 0
                    ? npc?.stats?.skills?.investigation
                    : calculateAbilityBonus(npc?.stats?.abilityScores.intelligence)
                }
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.medicine")}
                value={npc?.stats?.skills?.medicine > 0 ? 2 : 0}
                icon={<CrossIcon aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.wisdom}
                skills={
                  npc?.stats?.skills?.medicine > 0
                    ? npc?.stats?.skills?.medicine
                    : calculateAbilityBonus(npc?.stats?.abilityScores.wisdom)
                }
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.nature")}
                value={npc?.stats?.skills?.nature > 0 ? 2 : 0}
                icon={<Sprout aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.intelligence}
                skills={
                  npc?.stats?.skills?.nature > 0
                    ? npc?.stats?.skills?.nature
                    : calculateAbilityBonus(npc?.stats?.abilityScores.intelligence)
                }
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.perception")}
                value={npc?.stats?.skills?.perception > 0 ? 2 : 0}
                icon={<Eye aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.wisdom}
                skills={
                  npc?.stats?.skills?.perception > 0
                    ? npc?.stats?.skills?.perception
                    : calculateAbilityBonus(npc?.stats?.abilityScores.wisdom)
                }
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.persuasion")}
                value={npc?.stats?.skills?.persuasion > 0 ? 2 : 0}
                icon={<MessageSquare aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.charisma}
                skills={
                  npc?.stats?.skills?.persuasion > 0
                    ? npc?.stats?.skills?.persuasion
                    : calculateAbilityBonus(npc?.stats?.abilityScores.charisma)
                }
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.religion")}
                value={npc?.stats?.skills?.religion > 0 ? 2 : 0}
                icon={<Church aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.intelligence}
                skills={
                  npc?.stats?.skills?.religion > 0
                    ? npc?.stats?.skills?.religion
                    : calculateAbilityBonus(npc?.stats?.abilityScores.intelligence)
                }
                tooltip={t("abilities.intelligence")}
              />
              <Skill
                skillName={t("skillNames.performance")}
                value={npc?.stats?.skills?.performance > 0 ? 2 : 0}
                icon={<MicVocal aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.charisma}
                skills={
                  npc?.stats?.skills?.performance > 0
                    ? npc?.stats?.skills?.performance
                    : calculateAbilityBonus(npc?.stats?.abilityScores.charisma)
                }
                tooltip={t("abilities.charisma")}
              />
              <Skill
                skillName={t("skillNames.survival")}
                value={npc?.stats?.skills?.survival > 0 ? 2 : 0}
                icon={<TreePine aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.wisdom}
                skills={
                  npc?.stats?.skills?.survival > 0
                    ? npc?.stats?.skills?.survival
                    : calculateAbilityBonus(npc?.stats?.abilityScores.wisdom)
                }
                tooltip={t("abilities.wisdom")}
              />
              <Skill
                skillName={t("skillNames.deception")}
                value={npc?.stats?.skills?.deception > 0 ? 2 : 0}
                icon={<Drama aria-hidden="true" />}
                accentColor={accentColor}
                masteriesAbility={npc?.stats?.abilityScores.charisma}
                skills={
                  npc?.stats?.skills?.deception > 0
                    ? npc?.stats?.skills?.deception
                    : calculateAbilityBonus(npc?.stats?.abilityScores.charisma)
                }
                tooltip={t("abilities.charisma")}
              />
            </div>
          </div>
        </section>

        {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4"
          aria-labelledby="additional-info-section"
          aria-label={tNpc("general.additionalInfo")}>
          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="alignment-heading">
            <h2
              id="alignment-heading"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {tPlayer("alignment")}
            </h2>
            <p
              className="font-semibold text-sm sm:text-base"
              aria-label={`${tPlayer("alignment")} : ${tAlignment(npc?.profile?.alignment)}`}>
              {tAlignment(npc?.profile?.alignment)}
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
              {t("passivePerception")}
            </h2>
            <p
              className="font-semibold text-lg sm:text-xl"
              aria-label={`${t("passivePerception")} : ${npc?.stats?.passivePerception}`}>
              {npc?.stats?.passivePerception}
            </p>
          </Card>

          {/* Aptitudes */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="abilities-heading">
            <div className="flex flex-row justify-between">
              <h2
                id="abilities-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("characterAbilities")}
              </h2>
              <div className="flex justify-end shrink-0">
                <button
                  onClick={() => {
                    if (openAccordionValues.length > 0) {
                      setOpenAccordionValues([]);
                    } else {
                      setOpenAccordionValues(npc?.abilities.map((ability, index) => `${ability.name}-${index}`));
                    }
                  }}
                  className={`cursor-pointer text-sm pr-3 py-2 hover:underline focus:outline-none focus:underline ${accentColor}`}
                  aria-label={openAccordionValues.length > 0 ? tMagic("collapseAll") : tMagic("expandAll")}
                  aria-expanded={openAccordionValues.length > 0}>
                  {openAccordionValues.length > 0 ? <ListChevronsDownUp /> : <ListChevronsUpDown />}
                </button>
              </div>
            </div>
            <Accordion
              type="multiple"
              value={openAccordionValues}
              onValueChange={setOpenAccordionValues}
              className="w-full">
              {npc?.abilities.map((ability, index) => (
                <AccordionItem
                  key={`${ability.name}-${index}`}
                  value={`${ability.name}-${index}`}>
                  <AccordionTrigger
                    className="text-left py-3"
                    aria-label={`${t("abilityDetails")} ${ability.name}`}>
                    <span className="text-sm sm:text-base font-medium">{ability.name}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-sm sm:text-base pb-3"
                    role="region"
                    aria-label={`${t("abilityDescription")} ${ability.name}`}>
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
