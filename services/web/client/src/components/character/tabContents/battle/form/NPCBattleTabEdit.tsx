import { NPC } from "@/types/character";
import { Controller, UseFormReturn, useFieldArray } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import Skill from "@/components/character/tabContents/general/shared/SavingThrow";
import Image from "next/image";

import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import { Bird, Mountain, Shovel, Waves } from "lucide-react";

interface NPCBattleTabEditProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NPCBattleTabEdit({ npc, accentColor, form }: NPCBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");

  // Field arrays pour les listes dynamiques
  const {
    fields: abilitiesFields,
    append: appendAbility,
    remove: removeAbility,
  } = useFieldArray({
    control: form.control,
    name: "abilities",
  });

  const {
    fields: standardActionsFields,
    append: appendStandardAction,
    remove: removeStandardAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.standard",
  });

  const {
    fields: legendaryActionsFields,
    append: appendLegendaryAction,
    remove: removeLegendaryAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.legendary",
  });

  const {
    fields: lairActionsFields,
    append: appendLairAction,
    remove: removeLairAction,
  } = useFieldArray({
    control: form.control,
    name: "actions.lair",
  });

  // Liste des ability scores pour les saving throws
  const abilityScoreKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-5 max-[426px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Statistiques */}
        <Card
          className="gap-3 p-4 md:px-6 col-span-3 2xl:col-span-2 h-fit"
          role="region"
          aria-labelledby="stats-heading-edit">
          <h2
            id="stats-heading-edit"
            className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
            {t("stats")}
          </h2>

          <div className="flex flex-row gap-2">
            {/* Classe d'Armure */}
            <Controller
              name="stats.armorClass"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="armor-class"
                    className="text-sm font-medium">
                    {t("armorClass")}
                  </label>
                  <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      id="armor-class"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "armor-class-error" : undefined}
                      placeholder={t("armorClass")}
                      min={0}
                      type="number"
                    />
                    <Image
                      src={ShieldIcon}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="size-5"
                    />
                  </div>

                  {fieldState.error && (
                    <FieldError
                      id="armor-class-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* Initiative */}
            <Controller
              name="stats.initiative"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="initiative"
                    className="text-sm font-medium">
                    {tEdit("initiative")}
                  </label>
                  <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      id="initiative"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "initiative-error" : undefined}
                      placeholder={tEdit("initiative")}
                      type="number"
                      min={0}
                    />
                    <Image
                      src={FeatherIcon}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="size-5"
                    />
                  </div>
                  {fieldState.error && (
                    <FieldError
                      id="initiative-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Vitesses */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{tEdit("speeds")}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <Controller
                name="stats.speed.walk"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-walk"
                      className="text-xs">
                      {tEdit("walk")}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id="speed-walk"
                        type="number"
                        min={0}
                        className="text-sm"
                      />
                      <Image
                        src={RunningIcon}
                        alt=""
                        aria-hidden="true"
                        className="size-6"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.climb"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-climb"
                      className="text-xs">
                      {tEdit("climb")}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id="speed-climb"
                        type="number"
                        className="text-sm"
                        min={0}
                      />
                      <Mountain
                        size={24}
                        className="text-black"
                        aria-hidden="true"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.swim"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-swim"
                      className="text-xs">
                      {tEdit("swim")}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id="speed-swim"
                        type="number"
                        min={0}
                        className="text-sm"
                      />
                      <Waves
                        size={24}
                        className="text-black"
                        aria-hidden="true"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.fly"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-fly"
                      className="text-xs">
                      {tEdit("fly")}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id="speed-fly"
                        type="number"
                        className="text-sm"
                        min={0}
                      />
                      <Bird
                        size={24}
                        className="text-black"
                        aria-hidden="true"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.speed.burrow"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="speed-burrow"
                      className="text-xs">
                      {tEdit("burrow")}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        id="speed-burrow"
                        type="number"
                        className="text-sm"
                        min={0}
                      />
                      <Shovel
                        size={24}
                        className="text-black"
                        aria-hidden="true"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </div>

          {/* Points de Vie */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("healthPoints")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Controller
                name="stats.currentHitPoints"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="health-current"
                      className="text-xs">
                      {tEdit("currentHP")}
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="health-current"
                      type="number"
                      className="text-sm"
                      min={0}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.maxHitPoints"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="health-max"
                      className="text-xs">
                      {tEdit("maxHP")}
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="health-max"
                      type="number"
                      className="text-sm"
                      min={0}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="stats.tempHitPoints"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="vertical">
                    <label
                      htmlFor="health-temp"
                      className="text-xs">
                      {tEdit("tempHP")}
                    </label>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      id="health-temp"
                      type="number"
                      className="text-sm"
                      min={0}
                    />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </div>

          {/* Hit Points Roll */}
          <Controller
            name="hitPointsRoll"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="hit-points-roll"
                  className="text-sm font-medium">
                  {t("hitPointsRoll")}
                </label>
                <Input
                  {...field}
                  value={field.value || ""}
                  id="hit-points-roll"
                  placeholder="ex: 8d10+16"
                  className="text-sm"
                  min={0}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </Card>

        {/* Jets de sauvegarde */}
        <div className="flex flex-col gap-2 col-span-2 2xl:col-span-1">
          <Card
            className="gap-3 p-4 md:px-6 h-fit"
            role="region"
            aria-labelledby="saving-throws-heading-edit">
            <h2
              id="saving-throws-heading-edit"
              className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
              {t("savingThrows")}
            </h2>
          </Card>
          <div className="grid max-[376px]:grid-cols-2 grid-cols-1 lg:grid-cols-2 gap-2">
            {abilityScoreKeys.map((key) => {
              const abilityName = tAbilities(key as any);
              const abilityScore = form.watch(`stats.abilityScores.${key}`) || 0;
              const savingThrowValue = form.watch(`stats.savingThrows.${key}`) || 0;
              const valeurCalculer = Math.floor((abilityScore - 10) / 2);
              const isProficient = savingThrowValue !== 0;
              const displayBonus = isProficient ? valeurCalculer + savingThrowValue : valeurCalculer;

              return (
                <Skill
                  key={key}
                  skillName={abilityName}
                  value={isProficient ? 2 : 0}
                  accentColor={accentColor}
                  skills={displayBonus}
                />
              );
            })}
          </div>
        </div>

        {/* Capacités et traits */}
        <div className="col-span-3 2xl:col-span-2">
          <AbilitiesUpdateSection
            title={t("abilitiesAndTraits")}
            form={form}
            fieldArrayName="abilities"
            fields={abilitiesFields}
            append={appendAbility}
            remove={removeAbility}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Actions Standards */}
        <ActionUpdateSection
          title={t("actions")}
          form={form}
          fieldArrayName="actions.standard"
          fields={standardActionsFields}
          append={appendStandardAction}
          remove={removeStandardAction}
          accentColor={accentColor}
        />

        {/* Actions Légendaires */}
        <ActionUpdateSection
          title={t("legendaryActions")}
          form={form}
          fieldArrayName="actions.legendary"
          fields={legendaryActionsFields}
          append={appendLegendaryAction}
          remove={removeLegendaryAction}
          accentColor={accentColor}
        />

        {/* Actions de Repaire */}
        <ActionUpdateSection
          title={t("lairActions")}
          form={form}
          fieldArrayName="actions.lair"
          fields={lairActionsFields}
          append={appendLairAction}
          remove={removeLairAction}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
