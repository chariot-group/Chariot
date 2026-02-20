import { Player } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SelectTrigger, Select, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { ClassNameEnum } from "@/schemas/character";
import { getLevelFromExperience, getExperienceForLevel, isLevelXpSynced } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";

interface PlayerGeneralTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function PlayerGeneralTabEdit({ player, accentColor, form }: PlayerGeneralTabEditProps) {
  const t = useTranslations("characterDetail.player.general");
  const tEdit = useTranslations("characterDetail.edit");
  const tClass = useTranslations("classes");

  // Gestion dynamique des classes
  const {
    fields: classFields,
    append: appendClass,
    remove: removeClass,
  } = useFieldArray({
    control: form.control,
    name: "class",
  });

  return (
    <>
      <div
        className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
        role="main"
        aria-label={t("characterInfoLabel")}>
        <section className="grid grid-cols-1 min-[450px]:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
          {/* Colonne 1 : Personnage et Maitrises */}
          <section
            className="flex flex-col gap-2 md:gap-4"
            aria-labelledby="character-info-section">
            {/* Personnage */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 order-1"
              role="region"
              aria-labelledby="character-heading">
              <h2
                id="character-heading-edit"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("character")}
              </h2>
              <div className="flex flex-col gap-4">
                {/* Niveau global (XP) et race */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-row gap-2">
                    {/* Race */}
                    <Controller
                      name="profile.race"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} orientation="vertical" className="flex-1">
                          <label htmlFor="character-race" className="text-sm font-medium">
                            {t("race")}
                          </label>
                          <Input
                            {...field}
                            value={field.value || ""}
                            id="character-race"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "character-race-error" : undefined}
                            placeholder={t("race")}
                            type="text"
                          />
                          {fieldState.error && <FieldError id="character-race-error" errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    {/* Subrace */}
                    <Controller
                      name="profile.subrace"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} orientation="vertical" className="flex-1">
                          <label htmlFor="character-subrace" className="text-sm font-medium">
                            {t("subrace")}
                          </label>
                          <Input
                            {...field}
                            value={field.value || ""}
                            id="character-subrace"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "character-subrace-error" : undefined}
                            placeholder={t("subrace")}
                            type="text"
                          />
                          {fieldState.error && <FieldError id="character-subrace-error" errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  {/* Niveau et XP avec synchronisation */}
                  <div className="flex flex-col border-b border-gray">
                    <div className="flex flex-row gap-2">

                      {/* Level Input */}
                      <Controller
                        name="progression.level"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation="vertical" className="flex-1">
                            <label htmlFor="character-level" className="text-sm font-medium">
                              {t("level")}
                            </label>
                            <Input
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              id="character-level"
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.error ? "character-level-error" : undefined}
                              placeholder="1"
                              type="number"
                              min="1"
                              max="20"
                            />
                            {fieldState.error && <FieldError id="character-level-error" errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      {/* XP Input */}
                      <Controller
                        name="progression.experience"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid} orientation="vertical" className="flex-1">
                            <label htmlFor="character-xp" className="text-sm font-medium">
                              {t("experience")}
                            </label>
                            <Input
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              id="character-xp"
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.error ? "character-xp-error" : undefined}
                              placeholder="0"
                              type="number"
                              min="0"
                            />
                            {fieldState.error && <FieldError id="character-xp-error" errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    </div>

                    {/* Suggestions de synchronisation */}
                    {(() => {
                      const currentLevel = form.watch("progression.level") || 1;
                      const currentXp = form.watch("progression.experience") || 0;
                      const calculatedLevel = getLevelFromExperience(currentXp);
                      const isSynced = isLevelXpSynced(currentXp, currentLevel);

                      if (isSynced) {
                        return (
                          <div className="flex items-center gap-2 p-2 bg-green/20 rounded text-sm text-green-600 dark:text-green-400">
                            <span>✓ {t("xpLevelSynced")}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-gray-middle-light">
                            {calculatedLevel !== currentLevel && (
                              <span>⚠️ {t("xpLevelMismatch", { xp: currentXp, level: calculatedLevel })}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.setValue("progression.level", calculatedLevel, { shouldDirty: true });
                              }}
                              className="flex-1 text-xs">
                              <ArrowRightLeft className="size-3 mr-1" />
                              {t("syncLevelButton", { level: calculatedLevel })}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const xpForLevel = getExperienceForLevel(currentLevel);
                                form.setValue("progression.experience", xpForLevel, { shouldDirty: true });
                              }}
                              className="flex-1 text-xs">
                              <ArrowRightLeft className="size-3 mr-1" />
                              {t("syncXpButton", { xp: getExperienceForLevel(currentLevel) })}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Classes dynamiques */}
                  <div className="flex flex-col gap-3">
                    {classFields.map((field, index) => {
                      const globalLevel = form.watch("progression.level") || 1;
                      const classLevels = form.watch("class") || [];
                      const totalClassLevels = classLevels.reduce((sum: number, c: any) => sum + (parseInt(c?.level) || 0), 0);
                      const currentClassLevel = parseInt(form.watch(`class.${index}.level`)) || 1;
                      const otherClassLevelsSum = totalClassLevels - currentClassLevel;
                      const maxLevelForThisClass = globalLevel - otherClassLevelsSum;

                      // Récupérer les classes déjà sélectionnées dans les autres champs
                      const selectedClasses = classLevels
                        .map((c: any, i: number) => i !== index ? c?.name : null)
                        .filter(Boolean);

                      return (
                        <div key={field.id} className="flex flex-col gap-3 p-4 border-b border-gray">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">{t("class")} {index + 1}</h4>
                            <div className="flex items-center gap-2">
                              {totalClassLevels > globalLevel && (
                                <span className="text-xs text-red px-2 py-1 bg-red/10 rounded">
                                  ⚠️ {t("classLevelExceeds")}
                                </span>
                              )}
                              {classFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeClass(index)}
                                  className="text-red hover:bg-red/10">
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Class Name Select */}
                            <Controller
                              name={`class.${index}.name`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical"
                                  className="col-span-2">
                                  <label
                                    htmlFor={`class-name-${index}`}
                                    className="text-sm font-medium">
                                    {t("className")}
                                  </label>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}>
                                    <SelectTrigger id={`class-name-${index}`}>
                                      <SelectValue placeholder={t("selectClass")} />
                                    </SelectTrigger>
                                    <SelectContent position="item-aligned">
                                      <SelectGroup>
                                        {Object.values(ClassNameEnum.enum)
                                          .filter((className) => !selectedClasses.includes(className))
                                          .map((className) => (
                                            <SelectItem key={className} value={className}>
                                              {tClass(className)}
                                            </SelectItem>
                                          ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              )}
                            />

                            {/* Class Level */}
                            <Controller
                              name={`class.${index}.level`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid || totalClassLevels > globalLevel}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`class-level-${index}`}
                                    className="text-sm font-medium">
                                    {t("classLevel")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    id={`class-level-${index}`}
                                    aria-invalid={fieldState.invalid}
                                    aria-describedby={fieldState.error ? `class-level-${index}-error` : undefined}
                                    placeholder="1"
                                    type="number"
                                    min="1"
                                    max={maxLevelForThisClass}
                                  />
                                  {fieldState.error && (
                                    <FieldError
                                      id={`class-level-${index}-error`}
                                      errors={[fieldState.error]}
                                    />
                                  )}
                                  {totalClassLevels > globalLevel && (
                                    <FieldError
                                      errors={[{ message: t("classLevelExceedsGlobal", { total: totalClassLevels, global: globalLevel }) }]}
                                    />
                                  )}
                                </Field>
                              )}
                            />

                            {/* Subclass Input */}
                            <Controller
                              name={`class.${index}.subclass`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field
                                  data-invalid={fieldState.invalid}
                                  orientation="vertical">
                                  <label
                                    htmlFor={`class-subclass-${index}`}
                                    className="text-sm font-medium">
                                    {t("subclass")}
                                  </label>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    id={`class-subclass-${index}`}
                                    aria-invalid={fieldState.invalid}
                                    aria-describedby={fieldState.error ? `class-subclass-${index}-error` : undefined}
                                    placeholder={t("subclass")}
                                    type="text"
                                  />
                                  {fieldState.error && (
                                    <FieldError
                                      id={`class-subclass-${index}-error`}
                                      errors={[fieldState.error]}
                                    />
                                  )}
                                </Field>
                              )}
                            />
                          </div>

                          {/* Class level indicator */}
                          <div className="text-xs text-gray-middle-light">
                            {t("classLevelInfo", { classLevel: currentClassLevel, totalLevel: totalClassLevels, globalLevel })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Bouton pour ajouter une 2e classe (max 2 classes) */}
                    {classFields.length < 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendClass({ name: "", subclass: "", level: 1, hitDice: 0 })}
                        className="flex items-center gap-2 border-dashed">
                        <Plus className="size-4" />
                        <span>{t("addSecondClass")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Caractéristiques */}
            <div className="order-3 min-[450px]:order-2">
              {/* <AbilityScores
                character={player}
                accentColor={accentColor}
              /> */}
            </div>

            {/* Maitrise */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 order-4 min-[450px]:order-3"
              role="region"
              aria-labelledby="proficiencies-heading">
              <h2
                id="proficiencies-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("proficiencies")}
              </h2>
              <dl className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <dt className="text-sm sm:text-base font-semibold">{t("languages")} :</dt>
                  <dd className="text-sm sm:text-base">{player?.stats?.languages.join(", ")}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-sm sm:text-base font-semibold">{t("tools")} :</dt>
                  <dd className="text-sm sm:text-base">{player?.stats?.tools.join(", ")}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-sm sm:text-base font-semibold">{t("weapons")} :</dt>
                  <dd className="text-sm sm:text-base wrap-break-words">{player?.stats?.weapons.join(", ")}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-sm sm:text-base font-semibold">{t("armors")} :</dt>
                  <dd className="text-sm sm:text-base">{player?.stats?.armors.join(", ")}</dd>
                </div>
              </dl>
            </Card>
          </section>
          {/* Colonne 2 : Bonus, Jets de sauvegarde et Compétences */}
          <section
            className="flex flex-col gap-2 md:gap-4 order-2 min-[450px]:order-0"
            aria-labelledby="characteristics-skills-section">
            {/* Bonus */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
              role="region"
              aria-labelledby="proficiency-bonus-heading">
              <h2
                id="proficiency-bonus-heading"
                className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
                {t("proficiencyBonus")}
              </h2>
              <p
                className="text-sm sm:text-base font-bold"
                aria-label={`${t("proficiencyBonus")} ${player?.stats?.proficiencyBonus}`}>
                {player?.stats?.proficiencyBonus >= 0
                  ? `+${player?.stats?.proficiencyBonus}`
                  : `${player?.stats?.proficiencyBonus}`}
              </p>
            </Card>

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
                className="grid grid-cols-2 gap-2"
                role="list">
                {/* {player?.stats &&
                  Object.entries(player?.stats?.savingThrows).map(([key, value]) => {
                    const isMasteredKey = isMastered(player, key);
                    const abilityName = t(`abilities.${key}`);
                    return (
                      <Skill
                        key={key}
                        skillName={abilityName}
                        value={isMasteredKey ? 2 : 0}
                        accentColor={accentColor}
                        skills={value}
                      />
                    );
                  })} */}
              </div>
            </div>

            {/* Compétences */}
            <div className="flex flex-col gap-2 order-4 min-[450px]:order-3">
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
              {/* <div
                className="grid grid-cols-2 gap-2"
                role="list"
                aria-label={t("skillsList")}>
                <Skill
                  skillName={t("skillNames.acrobatics")}
                  value={player?.stats?.masteries.acrobatics}
                  icon={<User2Icon aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.dexterity}
                  tooltip={t("abilities.dexterity")}
                />
                <Skill
                  skillName={t("skillNames.arcana")}
                  value={player?.stats?.masteries.arcana}
                  icon={<Sparkles aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.intelligence}
                  tooltip={t("abilities.intelligence")}
                />
                <Skill
                  skillName={t("skillNames.athletics")}
                  value={player?.stats?.masteries.athletics}
                  icon={<Footprints aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.strength}
                  tooltip={t("abilities.strength")}
                />
                <Skill
                  skillName={t("skillNames.stealth")}
                  value={player?.stats?.masteries.stealth}
                  icon={<VenetianMask aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.dexterity}
                  tooltip={t("abilities.dexterity")}
                />
                <Skill
                  skillName={t("skillNames.animalHandling")}
                  value={player?.stats?.masteries.animalHandling}
                  icon={<PawPrint aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.wisdom}
                  tooltip={t("abilities.wisdom")}
                />
                <Skill
                  skillName={t("skillNames.sleightHand")}
                  value={player?.stats?.masteries.sleightHand}
                  icon={<LockKeyhole aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.dexterity}
                  tooltip={t("abilities.dexterity")}
                />
                <Skill
                  skillName={t("skillNames.history")}
                  value={player?.stats?.masteries.history}
                  icon={<Notebook aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.intelligence}
                  tooltip={t("abilities.intelligence")}
                />
                <Skill
                  skillName={t("skillNames.intimidation")}
                  value={player?.stats?.masteries.intimidation}
                  icon={<User2Icon aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.charisma}
                  tooltip={t("abilities.charisma")}
                />
                <Skill
                  skillName={t("skillNames.insight")}
                  value={player?.stats?.masteries.insight}
                  icon={<Brain aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.wisdom}
                  tooltip={t("abilities.wisdom")}
                />
                <Skill
                  skillName={t("skillNames.investigation")}
                  value={player?.stats?.masteries.investigation}
                  icon={<CircleQuestionMark aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.intelligence}
                  tooltip={t("abilities.intelligence")}
                />
                <Skill
                  skillName={t("skillNames.medicine")}
                  value={player?.stats?.masteries.medicine}
                  icon={<CrossIcon aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.wisdom}
                  tooltip={t("abilities.wisdom")}
                />
                <Skill
                  skillName={t("skillNames.nature")}
                  value={player?.stats?.masteries.nature}
                  icon={<Sprout aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.intelligence}
                  tooltip={t("abilities.intelligence")}
                />
                <Skill
                  skillName={t("skillNames.perception")}
                  value={player?.stats?.masteries.perception}
                  icon={<Eye aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.wisdom}
                  tooltip={t("abilities.wisdom")}
                />
                <Skill
                  skillName={t("skillNames.persuasion")}
                  value={player?.stats?.masteries.persuasion}
                  icon={<MessageSquare aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.charisma}
                  tooltip={t("abilities.charisma")}
                />
                <Skill
                  skillName={t("skillNames.religion")}
                  value={player?.stats?.masteries.religion}
                  icon={<Church aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.intelligence}
                  tooltip={t("abilities.intelligence")}
                />
                <Skill
                  skillName={t("skillNames.performance")}
                  value={player?.stats?.masteries.performance}
                  icon={<MicVocal aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.charisma}
                  tooltip={t("abilities.charisma")}
                />
                <Skill
                  skillName={t("skillNames.survival")}
                  value={player?.stats?.masteries.survival}
                  icon={<TreePine aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.wisdom}
                  tooltip={t("abilities.wisdom")}
                />
                <Skill
                  skillName={t("skillNames.deception")}
                  value={player?.stats?.masteries.deception}
                  icon={<Drama aria-hidden="true" />}
                  accentColor={accentColor}
                  proficiencyBonus={player?.stats?.proficiencyBonus}
                  masteriesAbility={player?.stats?.abilityScores.charisma}
                  tooltip={t("abilities.charisma")}
                />
              </div> */}
            </div>
          </section>

          {/* Colonne 3 : Alignement, Perception passive, Historique et Aptitudes */}
          <section
            className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1 order-5 min-[450px]:order-0"
            aria-labelledby="additional-info-section">
            {/* Epuisement */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
              role="region"
              aria-labelledby="exhaustion-heading">
              <h2
                id="exhaustion-heading"
                className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
                {t("exhaustion")}
              </h2>
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="font-semibold text-lg focus:outline-none focus:ring-1 focus:ring-offset-2 rounded px-2"
                    aria-label={`${t("exhaustionLevel")} ${player.exhaustionLevel}`}
                    aria-describedby="exhaustion-description">
                    {player.exhaustionLevel}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p id="exhaustion-description">{infoExhaustionLevel(player.exhaustionLevel)}</p>
                </TooltipContent>
              </Tooltip> */}
            </Card>

            {/* Alignement */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
              role="region"
              aria-labelledby="alignment-heading">
              {/* <h2
                id="alignment-heading"
                className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
                {tPlayer("alignment")}
              </h2>
              <p
                className="font-semibold text-sm sm:text-base"
                aria-label={`${tPlayer("alignment")} : ${tAlignment(player?.profile?.alignment)}`}>
                {tAlignment(player?.profile?.alignment)}
              </p> */}
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
                aria-label={`${t("passivePerception")} : ${player?.stats?.passivePerception}`}>
                {player?.stats?.passivePerception}
              </p>
            </Card>

            {/* Inspiration */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
              role="region"
              aria-labelledby="inspiration-heading">
              <h2
                id="inspiration-heading"
                className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
                {t("inspiration")}
              </h2>
              <div className="flex items-center gap-2">
                {/* <Checkbox
                  id="inspiration-checkbox"
                  checked={checked}
                  onCheckedChange={(value) => setChecked(value === true)}
                  disabled
                  aria-label={`${t("inspiration")} ${checked ? t("inspirationActive") : t("inspirationInactive")}`}
                  aria-describedby="inspiration-heading"
                /> */}
                <label
                  htmlFor="inspiration-checkbox"
                  className="sr-only">
                  {t("inspirationState")}
                </label>
              </div>
            </Card>

            {/* Historique */}
            <Card
              className="gap-3 py-4 px-4 md:px-6 flex-row items-center justify-between"
              role="region"
              aria-labelledby="background-heading">
              <h2
                id="background-heading"
                className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
                {t("background")}
              </h2>
              <p
                className="font-semibold text-sm sm:text-base sm:text-right"
                aria-label={`${t("background")} : ${player?.profile?.history}`}>
                {player?.profile?.history}
              </p>
            </Card>

            {/* Aptitudes */}
            {/* <AbilitiesSection
              abilities={player.abilities}
              accentColor={accentColor}
              title={t("characterAbilities")}
              headingId="abilities-heading"
              className="gap-3 py-4 px-4 md:px-6"
            /> */}
          </section>
        </section>
      </div >
      <div
        className="w-full flex flex-col gap-2 md:gap-4 px-2 sm:px-0"
        role="main"
        aria-labelledby="general-tab-edit">
        <h2 id="general-tab-edit" className="sr-only">
          {t("title")}
        </h2>

        {/* Section Informations de base */}
        <Card className="gap-4">
          <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("basicInfo")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prénom */}
            <Controller
              name="firstname"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="firstname" className="text-sm font-medium">
                    {tEdit("firstname")}
                  </label>
                  <Input
                    {...field}
                    id="firstname"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "firstname-error" : undefined}
                    placeholder={tEdit("firstname")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="firstname-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Nom */}
            <Controller
              name="lastname"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="lastname" className="text-sm font-medium">
                    {tEdit("lastname")}
                  </label>
                  <Input
                    {...field}
                    id="lastname"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "lastname-error" : undefined}
                    placeholder={tEdit("lastname")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="lastname-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* Surnom (optionnel) */}
          <Controller
            name="surname"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="vertical">
                <label htmlFor="surname" className="text-sm font-medium">
                  {tEdit("surname")} <span className="text-gray-middle-light">({tEdit("optional")})</span>
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="surname"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "surname-error" : undefined}
                  placeholder={tEdit("surname")}
                  type="text"
                />
                {fieldState.error && <FieldError id="surname-error" errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>

        {/* Section Profil */}
        <Card className="gap-4">
          <h3 className={`text-${accentColor} text-xl font-bold`}>{tEdit("profile")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Race */}
            <Controller
              name="profile.race"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="profile-race" className="text-sm font-medium">
                    {tEdit("race")}
                  </label>
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="profile-race"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "profile-race-error" : undefined}
                    placeholder={tEdit("race")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="profile-race-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Alignement */}
            <Controller
              name="profile.alignment"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="vertical">
                  <label htmlFor="profile-alignment" className="text-sm font-medium">
                    {tEdit("alignment")}
                  </label>
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="profile-alignment"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "profile-alignment-error" : undefined}
                    placeholder={tEdit("alignment")}
                    type="text"
                  />
                  {fieldState.error && <FieldError id="profile-alignment-error" errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </Card>

        {/* 
        TODO : Ajouter les autres sections d'édition ici :
        - Caractéristiques (AbilityScores)
        - Compétences (Skills) 
        - Langues
        - Etc.
        
        Pour l'instant, ce composant montre juste la structure de base.
        Les développeurs peuvent l'étendre avec d'autres champs.
      */}
        <Card className="gap-4 bg-blue/10 border-blue">
          <p className="text-sm text-gray-middle-light italic">
            🚧 {tEdit("editInProgress")} - Les autres champs seront ajoutés progressivement par les développeurs selon
            les besoins de chaque onglet.
          </p>
        </Card>
      </div>
    </>
  );
}
