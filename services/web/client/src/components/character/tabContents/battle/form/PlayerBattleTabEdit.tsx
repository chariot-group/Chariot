import { Player } from "@/types/character";
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import AbilitiesUpdateSection from "@/components/character/tabContents/shared/AbilitiesUpdateSection";
import ActionUpdateSection from "@/components/character/tabContents/battle/shared/ActionUpdateSection";
import Skill from "@/components/character/tabContents/general/shared/Skill";
import SavingThrowsEdit from "@/components/character/tabContents/general/form/SavingThrowsEdit";
import Image from "next/image";

import RedCircle from "@public/assets/icons/red-circle.svg";
import WhiteCircle from "@public/assets/icons/white-circle.svg";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Bird, Mountain, Shovel, Waves } from "lucide-react";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RulerIcon } from "lucide-react";

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const;

interface PlayerBattleTabEditProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function PlayerBattleTabEdit({ player, accentColor, form }: PlayerBattleTabEditProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const tClass = useTranslations("classes");

  const abilityScoreKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;

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
    name: "actions",
  });

  const { fields: classFields } = useFieldArray({
    control: form.control,
    name: "class",
  });

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid grid-cols-4 max-[376px]:grid-cols-1 gap-3 md:gap-4 w-full">
        {/* Section Points de Vie */}
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

            {/* Taille */}
            <Controller
              name="stats.size"
              control={form.control}
              defaultValue="Medium"
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  <label
                    htmlFor="size"
                    className="text-sm font-medium">
                    {tEdit("size")}
                  </label>
                  <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                    <Select
                      value={field.value || "Medium"}
                      onValueChange={field.onChange}>
                      <SelectTrigger
                        id="size"
                        className="border-none bg-transparent">
                        <SelectValue placeholder={tEdit("selectSize")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {SIZES.map((size) => (
                            <SelectItem
                              key={size}
                              value={size}>
                              {t(`sizes.${size}` as any)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <RulerIcon
                      size={20}
                      className="text-black shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  {fieldState.error && (
                    <FieldError
                      id="size-error"
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
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("hitPointsRoll")}</h3>
            <div className="flex flex-col gap-3">
              {classFields.map((classField, index) => {
                const className = form.watch(`class.${index}.name`);
                return (
                  <div
                    key={classField.id}
                    className="flex gap-2 justify-between">
                    <Controller
                      name={`class.${index}.level`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="vertical">
                          <label
                            htmlFor={`class-${index}-level`}
                            className="text-xs">
                            {t("hitLevel")} ({tClass(className)})
                          </label>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                            id={`class-${index}-level`}
                            type="number"
                            className="text-sm"
                            min={1}
                            max={20}
                          />
                          {fieldState.error && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`class.${index}.hitDice`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          orientation="vertical">
                          <label
                            htmlFor={`class-${index}-hitdice`}
                            className="text-xs">
                            {t("hitDice")}
                          </label>
                          <Select
                            defaultValue={String(field.value)}
                            onValueChange={(value) => field.onChange(Number(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="item-aligned">
                              <SelectGroup>
                                <SelectItem value="6">d6</SelectItem>
                                <SelectItem value="8">d8</SelectItem>
                                <SelectItem value="10">d10</SelectItem>
                                <SelectItem value="12">d12</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          {fieldState.error && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Jets de Sauvegarde */}
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
          <SavingThrowsEdit form={form} accentColor={accentColor} />
        </div>

        {/* Jets de sauvegarde contre la mort */}
        <Card
          className="gap-3 p-4 md:px-6 h-fit col-span-3 md:col-span-2 lg:col-span-1 items-end"
          role="region"
          aria-labelledby="death-saves-heading">
          <h2
            id="death-saves-heading"
            className={`text-xl sm:text-2xl font-semibold self-start ${accentColor}`}>
            {t("deathSaves")}
          </h2>
          <div className=" grid grid-cols-2 gap-2 items-center w-full">
            <span>{t("successes")}</span>
            <div
              className="grid grid-cols-3 w-2/3 lg:w-4/5"
              role="group"
              aria-label={t("successes")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentSuccesses = form.watch("deathSaves.successes") ?? player.deathSaves.successes;
                return (
                  <button
                    key={"death-save-success-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.successes", index + 1, { shouldDirty: true })}
                    className="cursor-pointer hover:opacity-80 transition-opacity p-1"
                    aria-label={`${t("successes")} ${index + 1}`}>
                    <Image
                      src={index < currentSuccesses ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
            <span>{t("failures")}</span>
            <div
              className="grid grid-cols-3 w-2/3 lg:w-4/5"
              role="group"
              aria-label={t("failures")}>
              {Array.from({ length: 3 }).map((_, index) => {
                const currentFailures = form.watch("deathSaves.failures") ?? player.deathSaves.failures;
                return (
                  <button
                    key={"death-save-failure-" + index}
                    type="button"
                    onClick={() => form.setValue("deathSaves.failures", index + 1, { shouldDirty: true })}
                    className="cursor-pointer hover:opacity-80 transition-opacity p-1"
                    aria-label={`${t("failures")} ${index + 1}`}>
                    <Image
                      src={index < currentFailures ? RedCircle : WhiteCircle}
                      alt=""
                      width={20}
                      height={20}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.setValue("deathSaves.successes", 0, { shouldDirty: true });
              form.setValue("deathSaves.failures", 0, { shouldDirty: true });
            }}
            className="flex gap-2 self-start">
            <RefreshCcw />
            {tEdit("reset")}
          </Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-2 w-full">
        {/* Capacités et traits */}
        <div className="order-2 lg:order-1">
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
        <div className="flex flex-row gap-2 order-1 lg:order-2">
          {/* Actions */}
          <ActionUpdateSection
            title={t("actions")}
            form={form}
            fieldArrayName="actions"
            fields={standardActionsFields}
            append={appendStandardAction}
            remove={removeStandardAction}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  );
}
