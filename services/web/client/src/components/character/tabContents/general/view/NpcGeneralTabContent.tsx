import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import AbilityScores from "@/components/character/tabContents/general/shared/AbilityScores";
import AbilitiesSection from "@/components/character/tabContents/shared/AbilitiesSection";
import NpcColumn2 from "@/components/character/tabContents/general/view/NpcColumn2";
import NpcStatistics from "@/components/character/tabContents/shared/NpcStatistics";

interface NpcGeneralTabContentProps {
  npc: NPC;
  accentColor: string;
  onCharacterUpdate?: (updated?: NPC) => void;
}

export default function NpcGeneralTabContent({ npc, accentColor, onCharacterUpdate }: NpcGeneralTabContentProps) {
  const t = useTranslations("characterDetail.player.general");
  const tPlayer = useTranslations("characterDetail.player");
  const tNpc = useTranslations("characterDetail.npc");
  const tAlignment = useTranslations("alignments");
  const tEdit = useTranslations("characterDetail.edit");

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
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tEdit("firstname")} :</dt>
                <dd className="text-sm sm:text-base">{npc?.firstname}</dd>
              </div>
              {npc.lastname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("lastname")} :</dt>
                  <dd className="text-sm sm:text-base">{npc?.lastname}</dd>
                </div>
              )}
              {npc.surname && (
                <div className="flex flex-wrap gap-1">
                  <dt className="text-sm sm:text-base font-semibold">{tEdit("surname")} :</dt>
                  <dd className="text-sm sm:text-base">{npc?.surname}</dd>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tNpc("typeLabel")} :</dt>
                <dd className="text-sm sm:text-base">
                  {npc?.profile?.type} {npc?.profile?.subtype?.length > 0 && `(${npc?.profile?.subtype})`}
                </dd>
              </div>
            </dl>
          </Card>

          <NpcStatistics
            npc={npc}
            accentColor={accentColor}
          />

          <NpcColumn2
            npc={npc}
            accentColor={accentColor}
            className="sm:hidden flex"
          />

          {/* Caractéristiques */}
          <div>
            <AbilityScores
              character={npc}
              accentColor={accentColor}
            />
          </div>

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

        {/* Colonne 2 : Jets de sauvegarde et Compétences */}
        <NpcColumn2
          npc={npc}
          accentColor={accentColor}
          className="hidden sm:flex"
        />

        {/* Colonne 3 : Alignement, Perception passive et Aptitudes */}
        <section
          className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1"
          aria-labelledby="additional-info-section"
          aria-label={tNpc("general.additionalInfo")}>
          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
            role="region"
            aria-labelledby="alignment-heading">
            <h2
              id="alignment-heading"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
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
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("passivePerception")}
            </h2>
            <p
              className="font-semibold text-lg sm:text-xl"
              aria-label={`${t("passivePerception")} : ${npc?.stats?.passivePerception}`}>
              {npc?.stats?.passivePerception}
            </p>
          </Card>

          {/* Aptitudes */}
          <AbilitiesSection
            abilities={npc.abilities}
            accentColor={accentColor}
            title={t("characterAbilities")}
            headingId="abilities-heading"
            className="gap-3 py-4 px-4 md:px-6"
            characterId={npc._id}
            characterKind="npcs"
            onAfterAbilityUse={onCharacterUpdate}
          />
        </section>
      </div>
    </div>
  );
}
