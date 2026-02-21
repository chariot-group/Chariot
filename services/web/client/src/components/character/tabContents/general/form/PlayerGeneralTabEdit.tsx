import { Player } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SelectTrigger, Select, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
import { ClassNameEnum } from "@/schemas/character";
import { getLevelFromExperience, getExperienceForLevel, isLevelXpSynced, getProficiencyBonusFromLevel, isLevelProficiencyBonusSynced } from "@/utils/global.utils";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import AbilityScoresEdit from "./AbilityScoresEdit";
import SavingThrowsEdit from "./SavingThrowsEdit";

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
            aria-labelledby="character-profile">
            <h2
              id="character-profile-edit"
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
                      <div key={field.id} className={`flex flex-col gap-3 p-4 ${index < 1 && "border-b border-gray"}`}>
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
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-1"
            role="region"
            aria-labelledby="character-characteristics">
            <h2
              id="character-characteristics-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("characteristics")}
            </h2>

            <AbilityScoresEdit form={form} />
          </Card>
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-1"
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
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor="proficiency-languages" className="text-sm font-medium">
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
                    {fieldState.error && <FieldError id="proficiency-languages-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Tools */}
              <Controller
                name="stats.tools"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor="proficiency-tools" className="text-sm font-medium">
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
                    {fieldState.error && <FieldError id="proficiency-tools-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Weapons */}
              <Controller
                name="stats.weapons"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor="proficiency-weapons" className="text-sm font-medium">
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
                    {fieldState.error && <FieldError id="proficiency-weapons-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Armors */}
              <Controller
                name="stats.armors"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor="proficiency-armors" className="text-sm font-medium">
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
                    {fieldState.error && <FieldError id="proficiency-armors-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </Card>
        </section>
        {/* Colonne 2 : Bonus, Jets de sauvegarde et Compétences */}
        <section
          className="flex flex-col gap-2 md:gap-4 order-2 min-[450px]:order-0"
          aria-labelledby="characteristics-skills-section">
          {/* Bonus */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-1"
            role="region"
            aria-labelledby="character-proficiencybonus">
            <h2
              id="character-proficiencybonus-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("proficiencyBonus")}
            </h2>
            {/* Bonus de maîtrise avec synchronisation */}
            <div className="flex flex-col gap-2">
              <Controller
                name="stats.proficiencyBonus"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} orientation="vertical">
                    <label htmlFor="proficiency-bonus" className="text-sm font-medium">
                      {t("proficiencyBonusLabel")}
                    </label>
                    <Input
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                      id="proficiency-bonus"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "proficiency-bonus-error" : undefined}
                      placeholder="+2"
                      type="number"
                      min="2"
                      max="6"
                    />
                    {fieldState.error && <FieldError id="proficiency-bonus-error" errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Suggestions de synchronisation bonus/niveau */}
              {(() => {
                const currentLevel = form.watch("progression.level") || 1;
                const currentProficiencyBonus = form.watch("stats.proficiencyBonus") || 2;
                const calculatedBonus = getProficiencyBonusFromLevel(currentLevel);
                const isSynced = isLevelProficiencyBonusSynced(currentLevel, currentProficiencyBonus);

                if (isSynced) {
                  return (
                    <div className="flex items-center gap-2 p-2 bg-green/20 rounded text-sm text-green-600 dark:text-green-400">
                      <span>✓ {t("proficiencyBonusSynced")}</span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-middle-light">
                      <span>⚠️ {t("proficiencyBonusMismatch", { level: currentLevel, bonus: calculatedBonus })}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("stats.proficiencyBonus", calculatedBonus, { shouldDirty: true });
                      }}
                      className="text-xs">
                      <ArrowRightLeft className="size-3 mr-1" />
                      {t("syncProficiencyBonusButton", { bonus: calculatedBonus })}
                    </Button>
                  </div>
                );
              })()}
            </div>
          </Card>
          {/* Jets de sauvegarde */}
          <Card
            className="gap-3 py-4 px-4 md:px-6 order-1"
            role="region"
            aria-labelledby="character-savingthrows">
            <h2
              id="character-savingthrows-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>

            <SavingThrowsEdit form={form} accentColor={accentColor} />
          </Card>
        </section>
      </section>
    </div>
  );
}
