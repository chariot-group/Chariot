import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/character";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import { Bird, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import Image from "next/image";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickNumberCalculator } from "@/components/ui/quick-number-calculator";
import { useState } from "react";

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const;
interface StatisticsProps {
  player: Player;
  accentColor: string;
  form: UseFormReturn<any>;
}
export default function StatisticsUpdate({ player, accentColor, form }: StatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tClass = useTranslations("classes");
  const currentHitPointsValue = Number(form.watch("stats.currentHitPoints") ?? 0);
  const maxHitPointsValue = Number(form.watch("stats.maxHitPoints") ?? 0);
  const safeCurrentHitPoints = Number.isFinite(currentHitPointsValue) ? Math.max(0, currentHitPointsValue) : 0;
  const safeMaxHitPoints = Number.isFinite(maxHitPointsValue) ? Math.max(0, maxHitPointsValue) : 0;
  const currentHpConstraintMessage = tEdit("quickErrors.currentAboveMax");
  const maxHpConstraintMessage = tEdit("quickErrors.maxBelowCurrent");
  const [currentHpQuickError, setCurrentHpQuickError] = useState<string | null>(null);
  const [maxHpQuickError, setMaxHpQuickError] = useState<string | null>(null);

  function handleCurrentHpConstraintResult(payload: { wasClamped: boolean; source: "quick-action" | "direct-input" }) {
    if (payload.source !== "quick-action") {
      return;
    }

    if (payload.wasClamped) {
      setCurrentHpQuickError(currentHpConstraintMessage);
      return;
    }

    setCurrentHpQuickError(null);
  }

  function handleMaxHpConstraintResult(payload: { wasClamped: boolean; source: "quick-action" | "direct-input" }) {
    if (payload.source !== "quick-action") {
      return;
    }

    if (payload.wasClamped) {
      setMaxHpQuickError(maxHpConstraintMessage);
      return;
    }

    setMaxHpQuickError(null);
  }

  const { fields: classFields } = useFieldArray({
    control: form.control,
    name: "class",
  });

  return (
    <Card
      className="gap-3 p-4 md:px-6 col-span-3 2xl:col-span-2 h-fit"
      role="region"
      aria-labelledby="stats-heading-edit">
      <h2
        id="stats-heading-edit"
        className={`text-xl sm:text-2xl font-semibold ${accentColor}`}>
        {t("stats")}
      </h2>

      <div className="grid grid-cols-2 gap-4">
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
                className="text-sm font-medium truncate">
                {t("armorClass")}
              </label>
              <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                <Input
                  {...field}
                  value={field.value ?? ""}
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
                  value={field.value ?? ""}
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
      <div className="w-fit">
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
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
                    value={field.value ?? 0}
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
                    value={field.value ?? 0}
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
                    value={field.value ?? 0}
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
                    value={field.value ?? 0}
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
                    value={field.value ?? 0}
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
                  className="text-xs truncate">
                  {tEdit("currentHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? 0}
                  currentValue={field.value}
                  min={0}
                  max={safeMaxHitPoints}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  onApply={(nextValue) => field.onChange(nextValue)}
                  onConstraintResult={({ wasClamped, source }) => handleCurrentHpConstraintResult({ wasClamped, source })}
                  triggerLabel={`${tEdit("currentHP")} quick calculator`}
                  inputLabel={`${tEdit("currentHP")} value`}
                  tooltipPlaceholder={tEdit("quickNumberPlaceholder")}
                  inputProps={{
                    id: "health-current",
                    className: "text-sm",
                    name: field.name,
                    onBlur: field.onBlur,
                    "aria-invalid": fieldState.invalid || !!currentHpQuickError,
                    "aria-describedby": fieldState.error || currentHpQuickError ? "health-current-error" : undefined,
                  }}
                />
                {(currentHpQuickError || fieldState.error?.message) && (
                  <FieldError id="health-current-error">
                    {currentHpQuickError ?? fieldState.error?.message}
                  </FieldError>
                )}
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
                  className="text-xs truncate">
                  {tEdit("maxHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? 0}
                  currentValue={field.value}
                  min={safeCurrentHitPoints}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  onApply={(nextValue) => field.onChange(nextValue)}
                  onConstraintResult={({ wasClamped, source }) => handleMaxHpConstraintResult({ wasClamped, source })}
                  triggerLabel={`${tEdit("maxHP")} quick calculator`}
                  inputLabel={`${tEdit("maxHP")} value`}
                  tooltipPlaceholder={tEdit("quickNumberPlaceholder")}
                  inputProps={{
                    id: "health-max",
                    className: "text-sm",
                    name: field.name,
                    onBlur: field.onBlur,
                    "aria-invalid": fieldState.invalid || !!maxHpQuickError,
                    "aria-describedby": fieldState.error || maxHpQuickError ? "health-max-error" : undefined,
                  }}
                />
                {(maxHpQuickError || fieldState.error?.message) && (
                  <FieldError id="health-max-error">
                    {maxHpQuickError ?? fieldState.error?.message}
                  </FieldError>
                )}
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
                  className="text-xs truncate">
                  {tEdit("tempHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? 0}
                  currentValue={field.value}
                  min={0}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  onApply={(nextValue) => field.onChange(nextValue)}
                  triggerLabel={`${tEdit("tempHP")} quick calculator`}
                  inputLabel={`${tEdit("tempHP")} value`}
                  tooltipPlaceholder={tEdit("quickNumberPlaceholder")}
                  inputProps={{
                    id: "health-temp",
                    className: "text-sm",
                    name: field.name,
                    onBlur: field.onBlur,
                    "aria-invalid": fieldState.invalid,
                    "aria-describedby": fieldState.error ? "health-temp-error" : undefined,
                  }}
                />
                {fieldState.error && (
                  <FieldError
                    id="health-temp-error"
                    errors={[fieldState.error]}
                  />
                )}
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
                        {t("hitLevel")}
                        {className ? ` (${tClass(className)})` : ""}
                      </label>
                      <Input
                        {...field}
                        value={field.value ?? 1}
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
  );
}
