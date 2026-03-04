"use client";

import { User, X, Save } from "lucide-react";
import { Player, NPC } from "@/types/character";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import CharacterInventoryTabContent from "@/components/character/tabContents/inventory/CharacterInventoryTabContent";
import React, { useState, useEffect } from "react";
import CharacterHistoryTabContent from "@/components/character/tabContents/history/CharacterHistoryTabContent";
import CharacterBattleTabContent from "@/components/character/tabContents/battle/CharacterBattleTabContent";
import CharacterGeneralTabContent from "@/components/character/tabContents/general/CharacterGeneralTabContent";
import CharacterMagicTabContent from "@/components/character/tabContents/magic/CharacterMagicTabContent";
import CharacterTabs, { CharacterTab, TAB_COLORS, CHARACTER_TABS } from "@/components/character/CharacterTabs";
import { Button } from "@/components/ui/button";
import { useCharacterForm, CharacterType } from "@/hooks/useCharacterForm";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearNpcCodexDraft, selectNpcCodexDraft } from "@/store/slices/codexDraftSlice";

interface CharacterFormViewProps {
  /** Character type: 'players' or 'npcs' */
  characterType: CharacterType;
  /** Group ID for redirecting after creation */
  groupId?: string;
}

/**
 * Reusable character form view for creation
 * Displays tabs with empty form fields for creating a new character
 */
export default function CharacterFormView({ characterType, groupId }: CharacterFormViewProps) {
  const t = useTranslations("characterDetail");
  const tCreate = useTranslations("characterCreate");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const reduxCodexDraft = useAppSelector(selectNpcCodexDraft);

  const campaignId = params.idCampaign as string;
  const resolvedGroupId = groupId || (params.idGroup as string);

  // Lire l'onglet actif depuis l'URL (ou "general" par défaut)
  const tabFromUrl = (searchParams.get("tab") as CharacterTab) || "general";
  const [activeTab, setActiveTab] = useState<CharacterTab>(tabFromUrl);

  // Lire les données pré-remplies depuis l'URL (pour NPC depuis codex)
  const codexDataParam = searchParams.get("codexData");

  const codexData = useMemo(() => {
    if (reduxCodexDraft) return reduxCodexDraft;
    if (!codexDataParam) return null;
    try {
      return JSON.parse(decodeURIComponent(codexDataParam));
    } catch {
      return null;
    }
  }, [reduxCodexDraft, codexDataParam]);

  // Synchroniser l'état local avec l'URL au chargement
  useEffect(() => {
    const currentTab = (searchParams.get("tab") as CharacterTab) || "general";
    setActiveTab(currentTab);
  }, [searchParams]);

  // Fonction pour changer d'onglet et mettre à jour l'URL
  const handleTabChange = (newTab: string) => {
    const tab = newTab as CharacterTab;
    setActiveTab(tab);
    // Mettre à jour l'URL sans recharger la page
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("tab", tab);
    router.replace(`?${currentParams.toString()}`, { scroll: false });
  };

  const defaultSavingThrows = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };

  const defaultMasteries = {
    athletics: 0,
    acrobatics: 0,
    sleightHand: 0,
    stealth: 0,
    arcana: 0,
    history: 0,
    investigation: 0,
    nature: 0,
    religion: 0,
    animalHandling: 0,
    insight: 0,
    medicine: 0,
    perception: 0,
    survival: 0,
    deception: 0,
    intimidation: 0,
    performance: 0,
    persuasion: 0,
  };

  const defaultMasteriesAbility = {
    strength: false,
    dexterity: false,
    constitution: false,
    intelligence: false,
    wisdom: false,
    charisma: false,
  };

  const defaultNpcSkills = { ...defaultMasteries };

  const getAbilityModifier = (value?: number): number => Math.floor(((value ?? 10) - 10) / 2);

  const npcCodexDefaults = useMemo(() => {
    if (!codexData) return null;

    const abilityScores = {
      strength: codexData.stats?.abilityScores?.strength ?? 10,
      dexterity: codexData.stats?.abilityScores?.dexterity ?? 10,
      constitution: codexData.stats?.abilityScores?.constitution ?? 10,
      intelligence: codexData.stats?.abilityScores?.intelligence ?? 10,
      wisdom: codexData.stats?.abilityScores?.wisdom ?? 10,
      charisma: codexData.stats?.abilityScores?.charisma ?? 10,
    };

    const codexSavingThrows = codexData.stats?.savingThrows || {};
    const dexterityModifier = getAbilityModifier(abilityScores.dexterity);
    const baseArmorClass = codexData.stats?.armorClass ?? 0;
    const computedArmorClass = Math.max(baseArmorClass, 10 + dexterityModifier);
    const normalizedSavingThrows = {
      strength: Math.max(0, (codexSavingThrows.strength ?? getAbilityModifier(abilityScores.strength)) - getAbilityModifier(abilityScores.strength)),
      dexterity: Math.max(0, (codexSavingThrows.dexterity ?? getAbilityModifier(abilityScores.dexterity)) - getAbilityModifier(abilityScores.dexterity)),
      constitution: Math.max(0, (codexSavingThrows.constitution ?? getAbilityModifier(abilityScores.constitution)) - getAbilityModifier(abilityScores.constitution)),
      intelligence: Math.max(0, (codexSavingThrows.intelligence ?? getAbilityModifier(abilityScores.intelligence)) - getAbilityModifier(abilityScores.intelligence)),
      wisdom: Math.max(0, (codexSavingThrows.wisdom ?? getAbilityModifier(abilityScores.wisdom)) - getAbilityModifier(abilityScores.wisdom)),
      charisma: Math.max(0, (codexSavingThrows.charisma ?? getAbilityModifier(abilityScores.charisma)) - getAbilityModifier(abilityScores.charisma)),
    };

    return {
      ...codexData,
      groups: resolvedGroupId ? [resolvedGroupId] : codexData.groups || [],
      stats: {
        ...(codexData.stats || {}),
        armorClass: computedArmorClass,
        abilityScores,
        speed: {
          walk: codexData.stats?.speed?.walk ?? 30,
          climb: codexData.stats?.speed?.climb ?? 0,
          swim: codexData.stats?.speed?.swim ?? 0,
          fly: codexData.stats?.speed?.fly ?? 0,
          burrow: codexData.stats?.speed?.burrow ?? 0,
        },
        savingThrows: normalizedSavingThrows,
        skills: {
          ...defaultNpcSkills,
          ...(codexData.stats?.skills || {}),
        },
      },
    };
  }, [codexData, resolvedGroupId]);

  // Default values for a new character with the group pre-assigned
  const defaultValues = characterType === "players"
    ? {
      groups: resolvedGroupId ? [resolvedGroupId] : [],
      profile: {
        alignment: "True Neutral",
      },
      stats: {
        savingThrows: defaultSavingThrows,
        masteries: defaultMasteries,
        masteriesAbility: defaultMasteriesAbility,
      },
    }
    : npcCodexDefaults ? {
      ...npcCodexDefaults,
    } : {
      groups: resolvedGroupId ? [resolvedGroupId] : [],
      profile: {
        alignment: "True Neutral",
      },
    };

  // Initialiser le formulaire avec useCharacterForm (characterId = null pour création)
  const { form, onCreate, onCancel, isSaving } = useCharacterForm({
    characterId: null,
    type: characterType,
    defaultValues,
    onSuccess: (createdCharacter) => {
      // Redirect to the newly created character's page
      router.push(`/campaigns/${campaignId}/groups/${resolvedGroupId}/characters/${createdCharacter._id}`);
    },
  });

  const hasAppliedCodexDefaultsRef = useRef(false);

  useEffect(() => {
    if (characterType !== "npcs") return;
    if (!npcCodexDefaults) return;
    if (hasAppliedCodexDefaultsRef.current) return;

    hasAppliedCodexDefaultsRef.current = true;
    form.reset(npcCodexDefaults as any);
    if (reduxCodexDraft) {
      dispatch(clearNpcCodexDraft());
    }
  }, [characterType, npcCodexDefaults, form, reduxCodexDraft, dispatch]);

  // Create a placeholder character object for the tab content components
  // This is needed because the tab components expect a character prop
  const placeholderCharacter = characterType === "players"
    ? ({
      _id: "",
      firstname: "",
      lastname: "",
      surname: "",
      avatar: "",
      stats: {
        size: "Medium",
        maxHitPoints: 10,
        currentHitPoints: 10,
        tempHitPoints: 0,
        armorClass: 10,
        initiative: 0,
        speed: { walk: 30, climb: 0, swim: 0, fly: 0, burrow: 0 },
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        languages: [],
        passivePerception: 10,
        savingThrows: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        skills: {
          athletics: 0, acrobatics: 0, sleightHand: 0, stealth: 0, arcana: 0, history: 0,
          investigation: 0, nature: 0, religion: 0, animalHandling: 0, insight: 0, medicine: 0,
          perception: 0, survival: 0, deception: 0, intimidation: 0, performance: 0, persuasion: 0,
        },
        senses: [],
        proficiencyBonus: 2,
        armors: [],
        weapons: [],
        tools: [],
        masteries: {
          athletics: 0, acrobatics: 0, sleightHand: 0, stealth: 0, arcana: 0, history: 0,
          investigation: 0, nature: 0, religion: 0, animalHandling: 0, insight: 0, medicine: 0,
          perception: 0, survival: 0, deception: 0, intimidation: 0, performance: 0, persuasion: 0,
        },
        masteriesAbility: {
          strength: false, dexterity: false, constitution: false,
          intelligence: false, wisdom: false, charisma: false,
        },
      },
      affinities: { resistances: [], immunities: [], vulnerabilities: [] },
      abilities: [],
      spellcasting: [],
      appearance: {},
      background: {},
      treasure: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, treasure: "", equipment: "" },
      conditions: {
        blinded: false, charmed: false, deafened: false, frightened: false, grappled: false,
        incapacitated: false, invisible: false, paralyzed: false, petrified: false, poisoned: false,
        prone: false, restrained: false, stunned: false, unconscious: false,
      },
      groups: [],
      actions: [],
      inspiration: false,
      progression: { level: 1, experience: 0 },
      class: [{ name: "Fighter", subclass: "", level: 1, hitDice: 10 }],
      profile: { alignment: "True Neutral", race: "", subrace: "", history: "" },
      exhaustionLevel: 0,
      deathSaves: { successes: 0, failures: 0 },
    } as Player)
    : ({
      _id: "",
      firstname: "",
      lastname: "",
      surname: "",
      avatar: "",
      stats: {
        size: "Medium",
        maxHitPoints: 10,
        currentHitPoints: 10,
        tempHitPoints: 0,
        armorClass: 10,
        initiative: 0,
        speed: { walk: 30, climb: 0, swim: 0, fly: 0, burrow: 0 },
        abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        languages: [],
        passivePerception: 10,
        savingThrows: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        skills: {
          athletics: 0, acrobatics: 0, sleightHand: 0, stealth: 0, arcana: 0, history: 0,
          investigation: 0, nature: 0, religion: 0, animalHandling: 0, insight: 0, medicine: 0,
          perception: 0, survival: 0, deception: 0, intimidation: 0, performance: 0, persuasion: 0,
        },
        senses: [],
      },
      affinities: { resistances: [], immunities: [], vulnerabilities: [] },
      abilities: [],
      spellcasting: [],
      appearance: {},
      background: {},
      treasure: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, treasure: "", equipment: "" },
      conditions: {
        blinded: false, charmed: false, deafened: false, frightened: false, grappled: false,
        incapacitated: false, invisible: false, paralyzed: false, petrified: false, poisoned: false,
        prone: false, restrained: false, stunned: false, unconscious: false,
      },
      groups: [],
      actions: { standard: [], legendary: [], lair: [] },
      challenge: { challengeRating: 0, experiencePoints: 0 },
      profile: { alignment: "True Neutral", type: "", subtype: "" },
    } as NPC);

  const handleCancel = () => {
    onCancel();
    router.back();
  };

  const handleCreate = form.handleSubmit(onCreate);

  return (
    <main className="flex flex-col h-full overflow-hidden">
      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header avec onglets et titre de création */}
        <div className="shrink-0">
          <div className="mx-auto sm:px-6 md:px-8 px-2">
            <div className="justify-between w-full">
              {/* Infos de création */}
              <div className="flex flex-row items-end justify-between gap-4 xl:mb-0 mb-2">
                <div className="flex flex-col items-start xl:items-end text-left xl:text-right xl:max-w-full lg:max-w-3/4 md:max-w-2/3 w-full">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {characterType === "players" ? tCreate("titlePlayer") : tCreate("titleNpc")}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-300">
                    {tCreate("description")}
                  </p>
                </div>

                {/* Placeholder image */}
                <div
                  className="max-[425px]:hidden w-28 h-20 sm:w-20 sm:h-24 md:w-40 md:h-28 rounded-[15px] bg-gray flex items-center justify-center overflow-hidden shrink-0"
                  role="img"
                  aria-label={t("placeholder.noImage")}>
                  <User
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-middle-light"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Onglets */}
              <CharacterTabs
                activeTab={activeTab}
                listClassName="gap-1 flex-wrap justify-start self-start xl:self-end"
                triggerClassName="grow-0"
              />
            </div>
          </div>
        </div>

        {/* Contenu des onglets - scrollable */}
        <div className="flex-1 overflow-y-auto w-full mx-auto px-4 sm:px-6 md:px-8 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-dark/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-middle-light">
          {CHARACTER_TABS.map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-0 focus:outline-none"
              role="tabpanel"
              id={`${tab}-content`}
              aria-labelledby={tab}
              tabIndex={0}>
              {(() => {
                switch (tab) {
                  case "general":
                    return (
                      <CharacterGeneralTabContent
                        character={placeholderCharacter}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={true}
                      />
                    );
                  case "battle":
                    return (
                      <CharacterBattleTabContent
                        character={placeholderCharacter}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={true}
                      />
                    );
                  case "magic":
                    return (
                      <CharacterMagicTabContent
                        character={placeholderCharacter}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={true}
                      />
                    );
                  case "inventory":
                    return (
                      <CharacterInventoryTabContent
                        character={placeholderCharacter}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={true}
                      />
                    );
                  case "history":
                    return (
                      <CharacterHistoryTabContent
                        character={placeholderCharacter}
                        accentColor={TAB_COLORS[tab]}
                        form={form}
                        isEditing={true}
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

      {/* Footer avec boutons - fixe en bas */}
      <div className="shrink-0 w-full px-4 sm:px-6 md:px-10 py-5 border-t border-transparent">
        <div className="w-full mx-auto flex flex-row-reverse gap-4">
          {/* Bouton Créer */}
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isSaving}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCreate();
              }
            }}
            className={`
              text-lg font-semibold py-5.5
              ${activeTab === "general" ? "bg-blue hover:bg-blue/90 text-black" : ""}
              ${activeTab === "battle" ? "bg-red hover:bg-red/90 text-white" : ""}
              ${activeTab === "magic" ? "bg-pink hover:bg-pink/90 text-black" : ""}
              ${activeTab === "inventory" ? "bg-yellow hover:bg-yellow/90 text-black" : ""}
              ${activeTab === "history" ? "bg-green hover:bg-green/90 text-black" : ""}
            `}
            aria-label={tCreate("create")}
            aria-busy={isSaving}>
            <Save className="size-5" aria-hidden="true" />
            {isSaving ? tCreate("saving") : tCreate("create")}
          </Button>

          {/* Bouton Annuler */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="text-lg font-semibold py-5.5"
            aria-label={tCreate("cancel")}>
            <X className="size-5" aria-hidden="true" />
            {tCreate("cancel")}
          </Button>
        </div>
      </div>
    </main>
  );
}
