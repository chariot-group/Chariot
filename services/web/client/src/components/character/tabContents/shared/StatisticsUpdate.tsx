import { Card } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, UseFormReturn, FieldValues } from "react-hook-form";
import { Bird, Dices, Mountain, RulerIcon, Shovel, Waves } from "lucide-react";
import ShieldIcon from "@public/assets/icons/shield-icon.svg";
import RunningIcon from "@public/assets/icons/running-icon.svg";
import Image from "next/image";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickNumberCalculator } from "@/components/ui/quick-number-calculator";
import { useToast } from "@/hooks/useToast";

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const;
interface StatisticsProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}
export default function StatisticsUpdate({ accentColor, form }: StatisticsProps) {
  const t = useTranslations("characterDetail.battle");
  const tEdit = useTranslations("characterDetail.edit");
  const tClass = useTranslations("classes");
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

  function handleHitDiceRemainingConstraintResult(
    index: number,
    maxCeiling: number,
    payload: {
      attemptedValue: number;
      appliedValue: number;
      wasClamped: boolean;
      source: "quick-action" | "direct-input";
    },
  ) {
    const path = `class.${index}.hitDiceRemaining`;

    if (payload.wasClamped && payload.attemptedValue > maxCeiling) {
      form.setError(path as never, {
        type: "manual",
        message: tEdit("hitDiceRemainingExceedsClassLevel", { max: maxCeiling }),
      });
      info(tEdit("quickWarnings.hitDiceRemainingClamped"));
      return;
    }

    if (!payload.wasClamped) {
      form.clearErrors(path as never);
      void form.trigger(path as never);
    }
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
              <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                <Image
                  src={ShieldIcon}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="size-5 brightness-0 invert"
                />
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
              <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                <Dices
                  size={20}
                  className="size-5 text-white shrink-0"
                  aria-hidden="true"
                />
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="initiative"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "initiative-error" : undefined}
                  placeholder={tEdit("initiative")}
                  type="number"
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
              <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                <RulerIcon
                  size={20}
                  className="text-white shrink-0"
                  aria-hidden="true"
                />
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
                          {t(`sizes.${size}` as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                  <Image
                    src={RunningIcon}
                    alt=""
                    aria-hidden="true"
                    className="size-6 brightness-0 invert"
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="speed-walk"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    className="text-sm"
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
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                  <Mountain
                    size={24}
                    className="text-white"
                    aria-hidden="true"
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="speed-climb"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="text-sm"
                    min={0}
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
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                  <Waves
                    size={24}
                    className="text-white"
                    aria-hidden="true"
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="speed-swim"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    className="text-sm"
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
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                  <Bird
                    size={24}
                    className="text-white"
                    aria-hidden="true"
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="speed-fly"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="text-sm"
                    min={0}
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
                <div className="flex items-center gap-1 bg-gray-middle-light rounded-[15px] pl-2">
                  <Shovel
                    size={24}
                    className="text-white"
                    aria-hidden="true"
                  />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="speed-burrow"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="text-sm"
                    min={0}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
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
                  value={field.value ?? ""}
                  currentValue={field.value}
                  min={0}
                  max={safeMaxHitPoints}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                  onApply={(nextValue) => field.onChange(nextValue)}
                  onConstraintResult={({ wasClamped, source }) =>
                    handleCurrentHpConstraintResult({ wasClamped, source })
                  }
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
                  className="text-xs truncate">
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
                  className="text-xs truncate">
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
        <h3 className="text-sm font-medium">{t("hitPointsRoll")}</h3>
        <div className="flex flex-col gap-3">
          {classFields.map((classField, index) => {
            const globalLevelNum = Number(form.watch("progression.level")) || 1;
            const classLevelsWatch = (form.watch("class") || []) as Array<{ level?: unknown }>;
            const totalClassLevels = classLevelsWatch.reduce(
              (sum: number, c) => sum + (parseInt(String(c?.level ?? 0), 10) || 0),
              0,
            );
            const currentClassLevel = parseInt(String(form.watch(`class.${index}.level`) ?? ""), 10) || 1;
            const otherClassLevelsSum = totalClassLevels - currentClassLevel;
            const maxLevelForThisClass = globalLevelNum - otherClassLevelsSum;

            const className = form.watch(`class.${index}.name`);
            const shareAllowed = Math.max(0, maxLevelForThisClass);
            const dicePoolCeiling = Math.min(currentClassLevel, shareAllowed);

            return (
              <div
                key={classField.id}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 justify-between">
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
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        id={`class-${index}-level`}
                        type="number"
                        className="text-sm"
                        min={1}
                        max={maxLevelForThisClass}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (raw === "") {
                            field.onChange("");
                            return;
                          }
                          const parsed = Number(raw);
                          if (!Number.isFinite(parsed)) return;

                          const floor = 1;
                          const ceil = Math.min(20, Math.max(floor, maxLevelForThisClass));
                          const clampedLevel = Math.max(floor, Math.min(ceil, Math.floor(parsed)));

                          field.onChange(clampedLevel);

                          const g = Number(form.getValues("progression.level")) || 1;
                          const cls = (form.getValues("class") || []) as Array<{ level?: unknown }>;
                          let totalNext = 0;
                          for (let j = 0; j < cls.length; j++) {
                            const v = j === index ? clampedLevel : parseInt(String(cls[j]?.level ?? 0), 10) || 0;
                            totalNext += v;
                          }
                          const sumOthersNext = totalNext - clampedLevel;
                          const shareNext = Math.max(0, g - sumOthersNext);
                          const cap = Math.min(clampedLevel, shareNext);
                          const remPath = `class.${index}.hitDiceRemaining`;
                          const remRaw = form.getValues(remPath);
                          if (typeof remRaw === "number" && !Number.isNaN(remRaw) && remRaw > cap) {
                            form.setValue(remPath, cap, { shouldDirty: true, shouldValidate: true });
                          }
                        }}
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
                <Controller
                  name={`class.${index}.hitDiceRemaining`}
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const stored = field.value;
                    const cappedStored =
                      typeof stored === "number" && !Number.isNaN(stored)
                        ? Math.max(0, Math.min(Math.floor(stored), dicePoolCeiling))
                        : undefined;
                    /** Vide si non persisté : ne pas miroiter le niveau de classe dans ce champ */
                    const displayRem = typeof cappedStored === "number" ? cappedStored : "";
                    /** Base des actions +/- quand aucune valeur enregistrée (comportement = pool plein) */
                    const currentForDiceOps = typeof cappedStored === "number" ? cappedStored : dicePoolCeiling;
                    const effectiveRemainingForUsed = typeof cappedStored === "number" ? cappedStored : dicePoolCeiling;
                    const hitDiceUsed = dicePoolCeiling - effectiveRemainingForUsed;

                    return (
                      <Field
                        data-invalid={fieldState.invalid}
                        orientation="vertical">
                        <label
                          htmlFor={`class-${index}-hit-dice-left`}
                          className="text-xs">
                          {t("hitDiceRemaining")}
                        </label>
                        <QuickNumberCalculator
                          value={displayRem}
                          currentValue={currentForDiceOps}
                          min={0}
                          max={dicePoolCeiling}
                          onEmptyInput={() => field.onChange(dicePoolCeiling)}
                          onValueChange={(nextValue) =>
                            field.onChange(Math.max(0, Math.min(nextValue, dicePoolCeiling)))
                          }
                          onApply={(nextValue) => field.onChange(Math.max(0, Math.min(nextValue, dicePoolCeiling)))}
                          onConstraintResult={(payload) =>
                            handleHitDiceRemainingConstraintResult(index, dicePoolCeiling, payload)
                          }
                          triggerLabel={`${t("hitDiceRemaining")} quick calculator`}
                          inputLabel={`${t("hitDiceRemaining")} value`}
                          tooltipPlaceholder={tEdit("quickNumberPlaceholder")}
                          inputProps={{
                            id: `class-${index}-hit-dice-left`,
                            className: "text-sm",
                            onBlur: () => {
                              field.onBlur();
                              const remPath = `class.${index}.hitDiceRemaining`;
                              const raw = form.getValues(remPath as never);
                              if (raw === undefined || raw === null) {
                                form.setValue(remPath as never, dicePoolCeiling, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                            },
                            "aria-invalid": fieldState.invalid,
                            "aria-describedby": fieldState.error ? `class-${index}-hit-dice-left-error` : undefined,
                          }}
                        />
                        <p className="text-xs text-muted-foreground tabular-nums pt-0.5">
                          {t("hitDiceUsed")}: {hitDiceUsed}
                        </p>
                        {fieldState.error && (
                          <FieldError
                            id={`class-${index}-hit-dice-left-error`}
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
