import { useTranslations } from "next-intl";
import Image from "next/image";

import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import FeatherIcon from "@public/assets/icons/feather-icon.svg";
import { Bird, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { NPC } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { QuickNumberCalculator } from "@/components/ui/quick-number-calculator";
import { useToast } from "@/hooks/useToast";

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const;

interface NpcStatisticsUpdateProps {
  npc: NPC;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function NpcStatisticsUpdate({ npc, accentColor, form }: NpcStatisticsUpdateProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const currentHitPointsValue = Number(form.watch("stats.currentHitPoints") ?? 0);
  const maxHitPointsValue = Number(form.watch("stats.maxHitPoints") ?? 0);
  const safeCurrentHitPoints = Number.isFinite(currentHitPointsValue) ? Math.max(0, currentHitPointsValue) : 0;
  const safeMaxHitPoints = Number.isFinite(maxHitPointsValue) ? Math.max(0, maxHitPointsValue) : 0;
  const currentHpConstraintWarning = tEdit("quickWarnings.currentOutOfBounds");
  const maxHpConstraintWarning = tEdit("quickWarnings.maxBelowCurrent");
  const { info } = useToast();

  function handleCurrentHpConstraintResult(payload: { wasClamped: boolean; source: "quick-action" | "direct-input" }) {
    if (payload.wasClamped) {
      info(currentHpConstraintWarning);
    }

    form.clearErrors(["stats.currentHitPoints", "stats.maxHitPoints"]);
  }

  function handleMaxHpConstraintResult(payload: { wasClamped: boolean; source: "quick-action" | "direct-input" }) {
    if (payload.wasClamped) {
      info(maxHpConstraintWarning);
    }

    form.clearErrors(["stats.currentHitPoints", "stats.maxHitPoints"]);
  }

  const hitPointsRollValue = form.watch("hitPointsRoll") || "";
  const [level, dice, modifier] = parseHitPointsRoll(hitPointsRollValue);

  function parseHitPointsRoll(base: string): [string, string, string] {
    const level: string = base && base.includes("d") ? base.split("d")[0] : "";
    const dice: string = base && base.includes("d") ? base.split("d")[1].split("+")[0] : "";
    const modifier: string = base && base.includes("+") ? base.split("+")[1] : "";
    return [level, dice, modifier];
  }

  function buildHitPointsRoll(level: string, dice: string, modifier: string): string {
    if (!level && !dice && !modifier) return "";
    return `${level}d${dice}${Number(modifier) > 0 ? `+${modifier}` : ""}`;
  }

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
                  className="text-sm">
                  {tEdit("walk")}
                </label>
                <div className="flex w-full items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
                  className="text-sm">
                  {tEdit("climb")}
                </label>
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
                  className="text-sm">
                  {tEdit("swim")}
                </label>
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
                  className="text-sm">
                  {tEdit("fly")}
                </label>
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
                  className="text-sm">
                  {tEdit("burrow")}
                </label>
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pr-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
          <Controller
            name="stats.currentHitPoints"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="health-current"
                  className="text-sm truncate">
                  {tEdit("currentHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? ""}
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
                    "aria-invalid": fieldState.invalid,
                    "aria-describedby": fieldState.error ? "health-current-error" : undefined,
                  }}
                />
                {fieldState.error && <FieldError id="health-current-error">{fieldState.error.message}</FieldError>}
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
                  className="text-sm truncate">
                  {tEdit("maxHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? ""}
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
                    "aria-invalid": fieldState.invalid,
                    "aria-describedby": fieldState.error ? "health-max-error" : undefined,
                  }}
                />
                {fieldState.error && <FieldError id="health-max-error">{fieldState.error.message}</FieldError>}
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
                  className="text-sm truncate">
                  {tEdit("tempHP")}
                </label>
                <QuickNumberCalculator
                  value={field.value ?? ""}
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
        <h3 className="text-sm font-medium">{t("hitDice")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
          <Controller
            name="hitPointsRoll"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="hit-points-roll-level"
                  className="text-sm">
                  {t("multiplicator")}
                </label>
                <Input
                  id="hit-points-roll-level"
                  className="text-sm"
                  min={1}
                  type="number"
                  value={level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    field.onChange(buildHitPointsRoll(newLevel, dice, modifier));
                  }}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="hitPointsRoll"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="hit-points-roll-dice"
                  className="text-sm truncate">
                  {t("hitDice")}
                </label>
                <Select
                  value={dice}
                  onValueChange={(value) => {
                    field.onChange(buildHitPointsRoll(level, value, modifier));
                  }}>
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
          <Controller
            name="hitPointsRoll"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <label
                  htmlFor="hit-points-roll-modifier"
                  className="text-sm truncate">
                  {t("bonusHealthDice")}
                </label>
                <Input
                  id="hit-points-roll-modifier"
                  className="text-sm"
                  min={0}
                  type="number"
                  value={modifier}
                  onChange={(e) => {
                    const newModifier = e.target.value;
                    field.onChange(buildHitPointsRoll(level, dice, newModifier));
                  }}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
