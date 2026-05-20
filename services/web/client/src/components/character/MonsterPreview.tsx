import { NPC } from "@/types/character";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import CharacterTabs, { CharacterTab, CHARACTER_TABS, TAB_COLORS } from "@/components/character/CharacterTabs";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterMagicTabContent from "@/components/character/tabContents/magic/CharacterMagicTabContent";
import CharacterInventoryTabContent from "@/components/character/tabContents/inventory/CharacterInventoryTabContent";
import CharacterHistoryTabContent from "@/components/character/tabContents/history/CharacterHistoryTabContent";
import { formatChallengeRating } from "@/utils/challengeRating.utils";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MonsterPreviewProps {
  monster: Partial<NPC>;
}

type ActionPreview = {
  name?: string;
  type?: string;
  description?: string;
  attackBonus?: number;
  range?: string;
  dc?: { dcType?: string; dcValue?: number; successType?: string };
};

export default function MonsterPreview({ monster }: MonsterPreviewProps) {
  const tGeneral = useTranslations("characterDetail.player.general");
  const tNpc = useTranslations("characterDetail.npc");
  const tEdit = useTranslations("characterDetail.edit");
  const tPreview = useTranslations("characterDetail.magic.monsterCodexDialog.preview");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<CharacterTab>("general");

  const abilityModifier = (value?: number) => Math.floor(((value ?? 10) - 10) / 2);

  const getProficiencyBonusFromCR = (cr: number): number => {
    if (cr >= 29) return 9;
    if (cr >= 25) return 8;
    if (cr >= 21) return 7;
    if (cr >= 17) return 6;
    if (cr >= 13) return 5;
    if (cr >= 9) return 4;
    if (cr >= 5) return 3;
    return 2;
  };

  const parseAttackBonusFromDescription = (description?: string): number | undefined => {
    if (!description) return undefined;
    const match = description.match(/\+(\d+)\s+to\s+hit/i);
    if (!match) return undefined;
    const parsed = parseInt(match[1], 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseDcFromDescription = (
    description?: string,
  ): { dcType?: string; dcValue?: number; successType?: string } | undefined => {
    if (!description) return undefined;
    const match = description.match(/DC\s*(\d+)\s*([A-Za-z]{3})?/i);
    if (!match) return undefined;
    const dcValue = parseInt(match[1], 10);
    if (Number.isNaN(dcValue)) return undefined;
    return {
      dcType: match[2]?.toLowerCase(),
      dcValue,
      successType: "none",
    };
  };

  const getHitDieBySize = (size: string): number => {
    const normalizedSize = (size || "Medium").toLowerCase();
    if (normalizedSize === "tiny") return 4;
    if (normalizedSize === "small") return 6;
    if (normalizedSize === "medium") return 8;
    if (normalizedSize === "large") return 10;
    if (normalizedSize === "huge") return 12;
    if (normalizedSize === "gargantuan") return 20;
    return 8;
  };

  const dexterityScore = monster.stats?.abilityScores?.dexterity ?? 10;
  const constitutionScore = monster.stats?.abilityScores?.constitution ?? 10;
  const dexterityModifier = Math.floor((dexterityScore - 10) / 2);
  const constitutionModifier = Math.floor((constitutionScore - 10) / 2);
  const baseArmorClass = monster.stats?.armorClass ?? 0;
  const computedArmorClass = Math.max(baseArmorClass, 10 + dexterityModifier);

  const maxHitPoints = monster.stats?.maxHitPoints ?? 0;
  const hitDie = getHitDieBySize(monster.stats?.size || "Medium");
  const averagePerDie = Math.floor(hitDie / 2) + 1;
  const denominator = Math.max(1, averagePerDie + constitutionModifier);
  const estimatedDiceCount = Math.max(1, Math.round(maxHitPoints / denominator));
  const totalConstitutionBonus = estimatedDiceCount * constitutionModifier;
  const computedHitPointsRoll =
    totalConstitutionBonus > 0
      ? `${estimatedDiceCount}d${hitDie}+${totalConstitutionBonus}`
      : totalConstitutionBonus < 0
        ? `${estimatedDiceCount}d${hitDie}${totalConstitutionBonus}`
        : `${estimatedDiceCount}d${hitDie}`;

  const challengeRating = monster.challenge?.challengeRating ?? 0;
  const proficiencyFromCR = getProficiencyBonusFromCR(challengeRating);

  const rawAbilityScores = {
    strength: monster.stats?.abilityScores?.strength ?? 10,
    dexterity: monster.stats?.abilityScores?.dexterity ?? 10,
    constitution: monster.stats?.abilityScores?.constitution ?? 10,
    intelligence: monster.stats?.abilityScores?.intelligence ?? 10,
    wisdom: monster.stats?.abilityScores?.wisdom ?? 10,
    charisma: monster.stats?.abilityScores?.charisma ?? 10,
  };

  const normalizedSavingThrows = {
    strength: Math.max(
      0,
      (monster.stats?.savingThrows?.strength ?? abilityModifier(rawAbilityScores.strength)) -
        abilityModifier(rawAbilityScores.strength),
    ),
    dexterity: Math.max(
      0,
      (monster.stats?.savingThrows?.dexterity ?? abilityModifier(rawAbilityScores.dexterity)) -
        abilityModifier(rawAbilityScores.dexterity),
    ),
    constitution: Math.max(
      0,
      (monster.stats?.savingThrows?.constitution ?? abilityModifier(rawAbilityScores.constitution)) -
        abilityModifier(rawAbilityScores.constitution),
    ),
    intelligence: Math.max(
      0,
      (monster.stats?.savingThrows?.intelligence ?? abilityModifier(rawAbilityScores.intelligence)) -
        abilityModifier(rawAbilityScores.intelligence),
    ),
    wisdom: Math.max(
      0,
      (monster.stats?.savingThrows?.wisdom ?? abilityModifier(rawAbilityScores.wisdom)) -
        abilityModifier(rawAbilityScores.wisdom),
    ),
    charisma: Math.max(
      0,
      (monster.stats?.savingThrows?.charisma ?? abilityModifier(rawAbilityScores.charisma)) -
        abilityModifier(rawAbilityScores.charisma),
    ),
  };

  const enrichAction = (action: ActionPreview) => ({
    ...action,
    name: action.name ?? "",
    type: action.type ?? "",
    attackBonus: action.attackBonus ?? parseAttackBonusFromDescription(action.description) ?? 0,
    dc: action.dc ?? parseDcFromDescription(action.description),
    range: action.range ?? "",
  });

  const normalizedMonster: NPC = {
    _id: monster._id || "",
    firstname: monster.firstname || "",
    lastname: monster.lastname || "",
    surname: monster.surname || "",
    avatar: "",
    stats: {
      size: monster.stats?.size || "Medium",
      maxHitPoints: monster.stats?.maxHitPoints ?? 0,
      currentHitPoints: monster.stats?.currentHitPoints ?? 0,
      tempHitPoints: monster.stats?.tempHitPoints ?? 0,
      armorClass: computedArmorClass,
      initiative: monster.stats?.initiative ?? 0,
      speed: {
        walk: monster.stats?.speed?.walk ?? 0,
        climb: monster.stats?.speed?.climb ?? 0,
        swim: monster.stats?.speed?.swim ?? 0,
        fly: monster.stats?.speed?.fly ?? 0,
        burrow: monster.stats?.speed?.burrow ?? 0,
      },
      abilityScores: {
        ...rawAbilityScores,
      },
      languages: monster.stats?.languages || [],
      passivePerception: monster.stats?.passivePerception ?? 10,
      savingThrows: normalizedSavingThrows,
      skills: {
        athletics: monster.stats?.skills?.athletics ?? 0,
        acrobatics: monster.stats?.skills?.acrobatics ?? 0,
        sleightHand: monster.stats?.skills?.sleightHand ?? 0,
        stealth: monster.stats?.skills?.stealth ?? 0,
        arcana: monster.stats?.skills?.arcana ?? 0,
        history: monster.stats?.skills?.history ?? 0,
        investigation: monster.stats?.skills?.investigation ?? 0,
        nature: monster.stats?.skills?.nature ?? 0,
        religion: monster.stats?.skills?.religion ?? 0,
        animalHandling: monster.stats?.skills?.animalHandling ?? 0,
        insight: monster.stats?.skills?.insight ?? 0,
        medicine: monster.stats?.skills?.medicine ?? 0,
        perception: monster.stats?.skills?.perception ?? 0,
        survival: monster.stats?.skills?.survival ?? 0,
        deception: monster.stats?.skills?.deception ?? 0,
        intimidation: monster.stats?.skills?.intimidation ?? 0,
        performance: monster.stats?.skills?.performance ?? 0,
        persuasion: monster.stats?.skills?.persuasion ?? 0,
      },
      senses: monster.stats?.senses
        ? monster.stats.senses.map((sense) => {
            const normalizedSense = sense as { name?: string; type?: string; value?: number | string | null };
            const parsedValue =
              normalizedSense.value === null || normalizedSense.value === undefined || normalizedSense.value === ""
                ? null
                : Number(normalizedSense.value);
            return {
              name: normalizedSense.name || normalizedSense.type || "",
              value: Number.isFinite(parsedValue) ? parsedValue : null,
            };
          })
        : [],
    },
    affinities: {
      resistances: monster.affinities?.resistances || [],
      immunities: monster.affinities?.immunities || [],
      vulnerabilities: monster.affinities?.vulnerabilities || [],
    },
    abilities: monster.abilities || [],
    spellcasting: monster.spellcasting || [],
    appearance: monster.appearance || {},
    background: monster.background || {},
    treasure: monster.treasure || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, treasure: "", equipment: "" },
    conditions: monster.conditions || {
      blinded: false,
      charmed: false,
      deafened: false,
      frightened: false,
      grappled: false,
      incapacitated: false,
      invisible: false,
      paralyzed: false,
      petrified: false,
      poisoned: false,
      prone: false,
      restrained: false,
      stunned: false,
      unconscious: false,
    },
    groups: monster.groups || [],
    actions: {
      standard: (monster.actions?.standard || []).map(enrichAction),
      legendary: (monster.actions?.legendary || []).map(enrichAction),
      lair: (monster.actions?.lair || []).map(enrichAction),
    },
    challenge: {
      challengeRating: challengeRating,
      experiencePoints: monster.challenge?.experiencePoints ?? 0,
    },
    profile: {
      alignment: monster.profile?.alignment || "True Neutral",
      type: monster.profile?.type || "",
      subtype: monster.profile?.subtype || "",
    },
    hitPointsRoll: monster.hitPointsRoll || computedHitPointsRoll,
  };

  const readOnlyForm = {} as unknown as UseFormReturn<FieldValues>;

  return (
    <div className="w-full flex flex-col gap-2 md:gap-4 px-1 min-h-0 h-full overflow-y-auto lg:overflow-hidden">
      <Card className="gap-3 py-4 px-4 md:px-6">
        <h2 className="text-xl sm:text-2xl font-semibold purple">{tGeneral("character")}</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
          <dl className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
              <dt className="text-sm sm:text-base font-semibold">{tEdit("firstname")} :</dt>
              <dd className="text-sm sm:text-base">{normalizedMonster.firstname}</dd>
            </div>
            {normalizedMonster.lastname && (
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tEdit("lastname")} :</dt>
                <dd className="text-sm sm:text-base">{normalizedMonster.lastname}</dd>
              </div>
            )}
            {normalizedMonster.surname && (
              <div className="flex flex-wrap gap-1">
                <dt className="text-sm sm:text-base font-semibold">{tEdit("surname")} :</dt>
                <dd className="text-sm sm:text-base">{normalizedMonster.surname}</dd>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              <dt className="text-sm sm:text-base font-semibold">{tNpc("typeLabel")} :</dt>
              <dd className="text-sm sm:text-base">
                {normalizedMonster.profile.type}
                {normalizedMonster.profile.subtype?.length > 0 && ` (${normalizedMonster.profile.subtype})`}
              </dd>
            </div>
            <div className="flex flex-wrap gap-1">
              <dt className="text-sm sm:text-base font-semibold">{tEdit("alignment")} :</dt>
              <dd className="text-sm sm:text-base">{normalizedMonster.profile.alignment}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 text-sm sm:text-base xl:border-l xl:pl-6 border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <abbr className="no-underline cursor-help">{tPreview("challengeRatingShort")}</abbr>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tCommon("challengeRatingTooltip")}</p>
                  </TooltipContent>
                </Tooltip>
                {" :"}
              </span>
              <span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <abbr className="no-underline cursor-help">CR</abbr>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tCommon("challengeRatingTooltip")}</p>
                  </TooltipContent>
                </Tooltip>{" "}
                {formatChallengeRating(normalizedMonster.challenge.challengeRating)}
              </span>
              <span className="text-gray-middle-light">
                ({normalizedMonster.challenge.experiencePoints} {tPreview("experiencePointsShort")})
              </span>
            </div>
            <p>
              <span className="font-semibold">{tPreview("calculatedArmorClass")} :</span> {computedArmorClass}
              {baseArmorClass > 0 && computedArmorClass !== baseArmorClass
                ? ` (${tPreview("sourceArmorClass", { value: baseArmorClass })})`
                : ""}
            </p>
            <p>
              <span className="font-semibold">{tPreview("hitPointsDice")} :</span> {normalizedMonster.hitPointsRoll}
            </p>
            <p>
              <span className="font-semibold">{tPreview("estimatedProficiencyBonus")} :</span> +{proficiencyFromCR}
            </p>
          </div>
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CharacterTab)}
        className="flex flex-col lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <CharacterTabs
          activeTab={activeTab}
          listClassName="gap-1 flex-nowrap w-full overflow-x-auto pb-1 pr-1"
          triggerClassName="grow-0 shrink-0"
        />

        <div className="mt-1 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0 lg:pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
          {CHARACTER_TABS.map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-0 focus:outline-none">
              {(() => {
                switch (tab) {
                  case "general":
                    return (
                      <CharacterGeneralTabContent
                        character={normalizedMonster}
                        accentColor={TAB_COLORS[tab]}
                        form={readOnlyForm}
                        isEditing={false}
                      />
                    );
                  case "battle":
                    return (
                      <CharacterBattleTabContent
                        character={normalizedMonster}
                        accentColor={TAB_COLORS[tab]}
                        form={readOnlyForm}
                        isEditing={false}
                      />
                    );
                  case "magic":
                    return (
                      <CharacterMagicTabContent
                        character={normalizedMonster}
                        accentColor={TAB_COLORS[tab]}
                        form={readOnlyForm}
                        isEditing={false}
                      />
                    );
                  case "inventory":
                    return (
                      <CharacterInventoryTabContent
                        character={normalizedMonster}
                        accentColor={TAB_COLORS[tab]}
                        form={readOnlyForm}
                        isEditing={false}
                      />
                    );
                  case "history":
                    return (
                      <CharacterHistoryTabContent
                        character={normalizedMonster}
                        accentColor={TAB_COLORS[tab]}
                        form={readOnlyForm}
                        isEditing={false}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
