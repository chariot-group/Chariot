import { Player } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray, FieldValues } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SelectTrigger, Select, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { ClassNameEnum, AlignmentEnum } from "@/schemas/character";
import { getLevelFromExperience, getExperienceForLevel, isLevelXpSynced } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { ComboboxInput } from "@/components/ui/combobox-input";
import AbilityScoresEdit from "@/components/character/tabContents/general/form/AbilityScoresEdit";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import Column2Edit from "@/components/character/tabContents/general/form/Column2Edit";
import StatisticsUpdate from "@/components/character/tabContents/shared/StatisticsUpdate";

interface PlayerGeneralTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function PlayerGeneralTabEdit({ player, accentColor, form }: PlayerGeneralTabEditProps) {
  type PlayerClassEntry = { name?: string; level?: number | string };

  const t = useTranslations("characterDetail.player.general");
  const tEdit = useTranslations("characterDetail.edit");
  const tClass = useTranslations("classes");
  const tAlignment = useTranslations("alignments");
  void player; // Silence unused player prop warning

  const {
    fields: abilitiesFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  // Alignements de base pour les players (excluant "Unaligned" et les "Any" alignments)
  // La liste complète AlignmentEnum.options sera utilisée pour les NPCs
  const playerAlignments = AlignmentEnum.options.filter(
    (alignment) => !alignment.startsWith("Any") && alignment !== "Unaligned",
  );

  // Calculer la perception passive automatiquement
  const calculatePassivePerception = (): number => {
    const wisdomScore = form.watch("stats.abilityScores.wisdom") || 10;
    const wisdomModifier = Math.floor((wisdomScore - 10) / 2);
    const perceptionMastery = form.watch("stats.masteries.perception") || 0;
    const proficiencyBonus = form.watch("stats.proficiencyBonus") || 2;

    // Base : 10 + modificateur de Sagesse
    let passivePerception = 10 + wisdomModifier;

    // Si maîtrisé en Perception (niveau 2 ou 3), ajouter le bonus
    if (perceptionMastery === 2) {
      passivePerception += proficiencyBonus;
    } else if (perceptionMastery === 3) {
      // Expertise : double bonus
      passivePerception += proficiencyBonus * 2;
    } else if (perceptionMastery === 1) {
      // Demi-maîtrise
      passivePerception += Math.floor(proficiencyBonus / 2);
    }

    return passivePerception;
  };

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
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-profile">
            <h2
              id="character-profile-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("character")}
            </h2>
            <div className="flex flex-col gap-4">
              {/* Noms du personnage */}
              <div className="grid grid-cols-2 gap-3">
                {/* Prénom */}
                <Controller
                  name="firstname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor="character-firstname"
                        className="text-sm font-medium">
                        {tEdit("firstname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-firstname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-firstname-error" : undefined}
                        placeholder={tEdit("firstname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-firstname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* Nom */}
                <Controller
                  name="lastname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical">
                      <label
                        htmlFor="character-lastname"
                        className="text-sm font-medium">
                        {tEdit("lastname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-lastname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-lastname-error" : undefined}
                        placeholder={tEdit("lastname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-lastname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* Surnom */}
                <Controller
                  name="surname"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      orientation="vertical"
                      className="col-span-2">
                      <label
                        htmlFor="character-surname"
                        className="text-sm font-medium">
                        {tEdit("surname")}
                      </label>
                      <Input
                        {...field}
                        value={field.value || ""}
                        id="character-surname"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={fieldState.error ? "character-surname-error" : undefined}
                        placeholder={tEdit("surname")}
                        type="text"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="character-surname-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>
              {/* Niveau global (XP) et race */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2">
                  {/* Race */}
                  <Controller
                    name="profile.race"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="character-race"
                          className="text-sm font-medium">
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
                        {fieldState.error && (
                          <FieldError
                            id="character-race-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                  {/* Subrace */}
                  <Controller
                    name="profile.subrace"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical"
                        className="flex-1">
                        <label
                          htmlFor="character-subrace"
                          className="text-sm font-medium">
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
                        {fieldState.error && (
                          <FieldError
                            id="character-subrace-error"
                            errors={[fieldState.error]}
                          />
                        )}
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
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="vertical"
                          className="flex-1">
                          <label
                            htmlFor="character-level"
                            className="text-sm font-medium">
                            {t("level")}
                          </label>
                          <Input
                            {...field}
                            value={field.value || ""}
                            id="character-level"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "character-level-error" : undefined}
                            placeholder={tEdit("levelPlaceholder")}
                            type="number"
                            min="1"
                            max="20"
                          />
                          {fieldState.error && (
                            <FieldError
                              id="character-level-error"
                              errors={[fieldState.error]}
                            />
                          )}
                        </Field>
                      )}
                    />

                    {/* XP Input */}
                    <Controller
                      name="progression.experience"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="vertical"
                          className="flex-1">
                          <label
                            htmlFor="character-xp"
                            className="text-sm font-medium">
                            {t("experience")}
                          </label>
                          <Input
                            {...field}
                            value={field.value || ""}
                            id="character-xp"
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "character-xp-error" : undefined}
                            placeholder={tEdit("zeroPlaceholder")}
                            type="number"
                            min="0"
                          />
                          {fieldState.error && (
                            <FieldError
                              id="character-xp-error"
                              errors={[fieldState.error]}
                            />
                          )}
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
                      <div className="flex flex-col gap-4">
                        <div className="text-xs text-gray-middle-light mx-1 mt-2">
                          {calculatedLevel !== currentLevel && (
                            <span>⚠️ {t("xpLevelMismatch", { xp: currentXp, level: calculatedLevel })}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mb-2">
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
                    const classLevels = (form.watch("class") || []) as PlayerClassEntry[];
                    const totalClassLevels = classLevels.reduce(
                      (sum: number, c) => sum + (parseInt(String(c?.level ?? 0), 10) || 0),
                      0,
                    );
                    const currentClassLevel = parseInt(form.watch(`class.${index}.level`)) || 1;
                    const otherClassLevelsSum = totalClassLevels - currentClassLevel;
                    const maxLevelForThisClass = globalLevel - otherClassLevelsSum;

                    // Récupérer les classes déjà sélectionnées dans les autres champs
                    const selectedClasses = classLevels
                      .map((c, i: number) => (i !== index ? c?.name : null))
                      .filter(Boolean);

                    return (
                      <div
                        key={field.id}
                        className={`flex flex-col gap-3 p-4 ${index < 1 && "border-b border-gray"}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">
                            {t("class")} {index + 1}
                          </h4>
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
                                          <SelectItem
                                            key={className}
                                            value={className}>
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
                                  className="text-sm font-medium truncate">
                                  {t("classLevel")}
                                </label>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  id={`class-level-${index}`}
                                  aria-invalid={fieldState.invalid}
                                  aria-describedby={fieldState.error ? `class-level-${index}-error` : undefined}
                                  placeholder={tEdit("levelPlaceholder")}
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
                                    errors={[
                                      {
                                        message: t("classLevelExceedsGlobal", {
                                          total: totalClassLevels,
                                          global: globalLevel,
                                        }),
                                      },
                                    ]}
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
                          {t("classLevelInfo", {
                            classLevel: currentClassLevel,
                            totalLevel: totalClassLevels,
                            globalLevel,
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bouton pour ajouter une 2e classe (max 2 classes) */}
                  {classFields.length < 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendClass({ name: undefined, subclass: "", level: 1, hitDice: 0 })}
                      className="flex items-center gap-2 border-dashed">
                      <Plus className="size-4" />
                      <span className="truncate">{t("addSecondClass")}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Section Points de Vie */}
          <StatisticsUpdate
            accentColor={accentColor}
            form={form}
          />

          <Column2Edit
            form={form}
            accentColor={accentColor}
            className="flex sm:hidden"
          />

          {/* Compétences */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-characteristics">
            <h2
              id="character-characteristics-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("characteristics")}
            </h2>

            <AbilityScoresEdit form={form} />
          </Card>

          {/* Maîtrises */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="character-proficiencies">
            <h2
              id="character-proficiencies-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("proficiencies")}
            </h2>

            <div className="flex flex-col gap-4">
              {/* Languages */}
              <Controller
                name="stats.languages"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="proficiency-languages"
                      className="text-sm font-medium">
                      {t("languages")}
                    </label>
                    <TagInput
                      id="proficiency-languages"
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={t.raw("proficiencyOptions.languages")}
                      placeholder={t("languages")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "proficiency-languages-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="proficiency-languages-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Tools */}
              <Controller
                name="stats.tools"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="proficiency-tools"
                      className="text-sm font-medium">
                      {t("tools")}
                    </label>
                    <TagInput
                      id="proficiency-tools"
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={t.raw("proficiencyOptions.tools")}
                      placeholder={t("tools")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "proficiency-tools-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="proficiency-tools-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Weapons */}
              <Controller
                name="stats.weapons"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="proficiency-weapons"
                      className="text-sm font-medium">
                      {t("weapons")}
                    </label>
                    <TagInput
                      id="proficiency-weapons"
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={t.raw("proficiencyOptions.weapons")}
                      placeholder={t("weapons")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "proficiency-weapons-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="proficiency-weapons-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Armors */}
              <Controller
                name="stats.armors"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="proficiency-armors"
                      className="text-sm font-medium">
                      {t("armors")}
                    </label>
                    <TagInput
                      id="proficiency-armors"
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={t.raw("proficiencyOptions.armors")}
                      placeholder={t("armors")}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "proficiency-armors-error" : undefined}
                    />
                    {fieldState.error && (
                      <FieldError
                        id="proficiency-armors-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </div>
          </Card>
        </section>

        {/* Colonne 2 : Bonus, Jets de sauvegarde et Compétences */}
        <Column2Edit
          form={form}
          accentColor={accentColor}
          className="sm:flex hidden"
        />

        <section
          className="flex flex-col gap-2 md:gap-4 sm:col-span-2 lg:col-span-1"
          aria-labelledby="additional-info-section">
          {/* Épuisement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="exhaustion-heading-edit">
            <h2
              id="exhaustion-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("exhaustion")}
            </h2>
            <Controller
              name="exhaustionLevel"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="exhaustion-level"
                    className="text-sm font-medium">
                    {t("exhaustionLevel")}
                  </label>
                  <Select
                    value={field.value?.toString() || "0"}
                    onValueChange={(value) => field.onChange(parseInt(value))}>
                    <SelectTrigger id="exhaustion-level">
                      <SelectValue placeholder={t("exhaustionLevel")}>
                        {field.value !== undefined && field.value !== null
                          ? `${t("level")} ${field.value}`
                          : t("exhaustionLevel")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectGroup>
                        {[0, 1, 2, 3, 4, 5, 6].map((level) => (
                          <SelectItem
                            key={level}
                            value={level.toString()}>
                            <div className="flex flex-col gap-1">
                              <span>
                                {t("level")} {level}
                              </span>
                              <span className="text-xs text-gray-middle-light">{t(`exhaustionLevels.${level}`)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </Card>

          {/* Alignement */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="alignment-heading-edit">
            <h2
              id="alignment-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("alignment")}
            </h2>
            <Controller
              name="profile.alignment"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="alignment"
                    className="text-sm font-medium">
                    {t("alignment")}
                  </label>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}>
                    <SelectTrigger id="alignment">
                      <SelectValue placeholder={t("alignment")} />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectGroup>
                        {playerAlignments.map((alignment) => (
                          <SelectItem
                            key={alignment}
                            value={alignment}>
                            {tAlignment(alignment as Parameters<typeof tAlignment>[0])}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </Card>

          {/* Perception passive */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="passive-perception-heading-edit">
            <h2
              id="passive-perception-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("passivePerception")}
            </h2>
            <div className="flex flex-col gap-2">
              <Controller
                name="stats.passivePerception"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="passive-perception"
                      className="text-sm font-medium">
                      {t("passivePerceptionOverride")}
                    </label>
                    <Input
                      {...field}
                      value={field.value || ""}
                      id="passive-perception"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "passive-perception-error" : undefined}
                      placeholder={calculatePassivePerception().toString()}
                      type="number"
                      min="1"
                      max="40"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="passive-perception-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Warning si différent du calcul automatique */}
              {(() => {
                const currentValue = form.watch("stats.passivePerception") || 0;
                const calculatedValue = calculatePassivePerception();

                if (currentValue !== calculatedValue && currentValue !== 0) {
                  return (
                    <div className="text-xs text-orange-600 dark:text-orange-400 p-2 bg-orange-600/10 rounded">
                      {t("passivePerceptionMismatch", { calculated: calculatedValue })}
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </Card>

          {/* Inspiration */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="inspiration-heading-edit">
            <h2
              id="inspiration-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("inspiration")}
            </h2>
            <Controller
              name="inspiration"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="inspiration-checkbox"
                    className="cursor-pointer"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="inspiration-checkbox"
                    className="cursor-pointer text-sm">
                    {field.value ? t("inspirationActive") : t("inspirationInactive")}
                  </Label>
                </div>
              )}
            />
          </Card>

          {/* Historique */}
          <Card
            className="gap-3 py-4 px-4 md:px-6"
            role="region"
            aria-labelledby="background-heading-edit">
            <h2
              id="background-heading-edit"
              className={`text-xl sm:text-2xl font-semibold truncate ${accentColor}`}>
              {t("background")}
            </h2>
            <Controller
              name="profile.history"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="background"
                    className="text-sm font-medium">
                    {t("background")}
                  </label>
                  <ComboboxInput
                    id="background"
                    value={field.value || ""}
                    onChange={field.onChange}
                    suggestions={t.raw("proficiencyOptions.backgrounds")}
                    placeholder={t("background")}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? "background-error" : undefined}
                  />
                  {fieldState.error && (
                    <FieldError
                      id="background-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </Card>
          {/* Capacités et traits */}
          <div>
            <AbilitiesUpdateSection
              title={t("abilitiesAndTraits")}
              form={form}
              fieldArrayName="abilities"
              fields={abilitiesFields}
              append={appendAbility}
              remove={removeAbility}
              accentColor={accentColor}
              abilityCounterMode="player"
            />
          </div>
        </section>
      </section>
    </div>
  );
}
