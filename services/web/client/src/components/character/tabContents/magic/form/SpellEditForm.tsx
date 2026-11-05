"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Controller, useWatch, type Path, type PathValue, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import type { Character, DamageDetails, HealingDetails, Spell } from "@/types/character";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { DamageTypeInput } from "@/components/ui/damage-type-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DICE_TYPES, SPELL_SCHOOLS } from "@/utils/magic.utils";
import { formatSignedBonus } from "@/utils/attack.utils";
import {
  coerceSpellDamageDetailsList,
  EMPTY_SPELL_DAMAGE_DETAILS,
  formatDamageFormula,
  ensureSpellDamageEditRows,
  hydrateSpellDamageDetails,
  isDamageDetailsFilled,
  parseDamageFormula,
} from "@/utils/spell-damage.utils";
import ListFormSection from "@/components/character/tabContents/shared/listCard/ListFormSection";

/** Dynamic RHF paths (template strings) widen to `string`; cast back to Path without changing runtime. */
const charPath = (path: string) => path as Path<Character>;

const LABEL_CLASS = "text-sm font-medium";

interface SpellEditFormProps {
  form: UseFormReturn<Character>;
  spellcastingIndex: number;
  spellIndex: number;
  /** DOM id prefix of this spell's controls (`${idPrefix}-name` is the focus target on Add). */
  idPrefix: string;
  isInnate: boolean;
  /** Calculated spell attack bonus, shown read-only for attack spells. */
  attackBonus: number;
}

/** Labelled text / number input bound to one spell field. */
function SpellInput({
  form,
  path,
  id,
  label,
  type = "text",
  min,
  max,
  placeholder,
  onValue,
  inputRef,
  className,
}: {
  form: UseFormReturn<Character>;
  path: string;
  id: string;
  label: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  placeholder?: string;
  /** Maps the raw input value before it is stored (e.g. "" → null). */
  onValue?: (raw: string) => unknown;
  inputRef?: (element: HTMLInputElement | null) => void;
  className?: string;
}) {
  return (
    <Controller
      name={charPath(path)}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          orientation="vertical"
          className={cn("min-w-0 gap-1", className)}>
          <label
            htmlFor={id}
            className={LABEL_CLASS}>
            {label}
          </label>
          <Input
            {...field}
            ref={(element) => {
              field.ref(element);
              inputRef?.(element);
            }}
            value={(field.value as string | number | null | undefined) ?? ""}
            onChange={(event) => field.onChange(onValue ? onValue(event.target.value) : event.target.value)}
            id={id}
            type={type}
            min={min}
            max={max}
            placeholder={placeholder ?? label}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${id}-error` : undefined}
          />
          {fieldState.error && (
            <FieldError
              id={`${id}-error`}
              errors={[fieldState.error]}
            />
          )}
        </Field>
      )}
    />
  );
}

const Row = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("grid min-w-0 gap-3", className)}>{children}</div>
);

type DiceValues = Pick<DamageDetails, "diceCount" | "diceType" | "bonus">;

const toNumberOrNull = (raw: string) => (raw === "" ? null : Number(raw));

/**
 * One damage or healing line laid out like its formula: `[count] d [die] + [bonus]`, an optional
 * extra field (damage type) and trailing control, then a muted preview of the resulting formula.
 * Each field keeps an accessible name; « d » and « + » are decorative.
 * @see FR-character-magic-list-card, FR-character-spell-multi-damage
 */
function DiceFormulaRow({
  id,
  value,
  onChange,
  extra,
  extraText,
  trailing,
}: {
  id: string;
  value: DiceValues | null | undefined;
  onChange: (key: keyof DiceValues, value: string | number | null) => void;
  /** Field after the bonus (damage type). */
  extra?: ReactNode;
  /** Text appended to the preview (damage type). */
  extraText?: string | null;
  trailing?: ReactNode;
}) {
  const tEdit = useTranslations("characterDetail.edit");
  const formula = formatDamageFormula(value?.diceCount, value?.diceType, value?.bonus, extraText);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <label
            htmlFor={`${id}-count`}
            className="sr-only">
            {tEdit("diceCount")}
          </label>
          <Input
            id={`${id}-count`}
            type="number"
            min={0}
            className="w-16 text-center"
            value={value?.diceCount ?? ""}
            onChange={(event) => onChange("diceCount", toNumberOrNull(event.target.value))}
          />
          <span
            className="text-sm font-semibold text-muted-foreground"
            aria-hidden="true">
            d
          </span>
          <Select
            value={value?.diceType || undefined}
            onValueChange={(next) => onChange("diceType", next)}>
            <SelectTrigger
              id={`${id}-dice`}
              className="w-20"
              aria-label={tEdit("diceType")}>
              <SelectValue placeholder="–" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {DICE_TYPES.map((dice) => (
                  <SelectItem
                    key={dice}
                    value={dice}>
                    {dice.replace(/^d/, "")}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span
            className="text-sm font-semibold text-muted-foreground"
            aria-hidden="true">
            +
          </span>
          <label
            htmlFor={`${id}-bonus`}
            className="sr-only">
            {tEdit("bonus")}
          </label>
          <Input
            id={`${id}-bonus`}
            type="number"
            className="w-16 text-center"
            value={value?.bonus ?? ""}
            onChange={(event) => onChange("bonus", toNumberOrNull(event.target.value))}
          />
        </div>
        {extra && <div className="min-w-36 flex-1">{extra}</div>}
        {trailing}
      </div>
      {formula && <p className="text-xs text-muted-foreground">= {formula}</p>}
    </div>
  );
}

/**
 * Expanded spell row, edit mode: General / Casting / Effects / Description sections.
 * @see FR-character-magic-list-card, FR-character-spell-multi-damage
 */
export default function SpellEditForm({
  form,
  spellcastingIndex,
  spellIndex,
  idPrefix,
  isInnate,
  attackBonus,
}: SpellEditFormProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const base = `spellcasting.${spellcastingIndex}.spells.${spellIndex}`;
  const levelInputRef = useRef<HTMLInputElement | null>(null);

  const spell = useWatch({ control: form.control, name: charPath(base) }) as Spell | undefined;
  const effectType = spell?.effectType;
  const damageDetails = spell?.damageDetails as DamageDetails | DamageDetails[] | undefined;
  const healingDetails = spell?.healingDetails as HealingDetails | undefined;
  const legacyDamage = spell?.damage;
  const legacyHealing = spell?.healing;

  // Legacy single damage object / formula string → editable list; legacy healing formula → dice.
  // @see FR-character-spell-multi-damage
  useEffect(() => {
    const damagePath = charPath(`${base}.damageDetails`);
    const hydrated = hydrateSpellDamageDetails(damageDetails, legacyDamage);
    const current = coerceSpellDamageDetailsList(damageDetails);
    const needsHydration =
      !Array.isArray(damageDetails) ||
      (current.length === 0 && hydrated.some(isDamageDetailsFilled)) ||
      (current.length > 0 && !current.some(isDamageDetailsFilled) && hydrated.some(isDamageDetailsFilled));
    if (needsHydration) {
      form.setValue(damagePath, ensureSpellDamageEditRows(hydrated) as PathValue<Character, Path<Character>>, {
        shouldDirty: hydrated.some(isDamageDetailsFilled) && !current.some(isDamageDetailsFilled),
      });
    } else if (current.length === 0) {
      form.setValue(damagePath, ensureSpellDamageEditRows([]) as PathValue<Character, Path<Character>>, {
        shouldDirty: false,
      });
    }

    const hasHealingDetails =
      healingDetails &&
      (healingDetails.diceCount ||
        healingDetails.diceType ||
        (healingDetails.bonus !== null && healingDetails.bonus !== undefined));
    if (legacyHealing?.trim() && !hasHealingDetails) {
      const parsed = parseDamageFormula(legacyHealing);
      if (parsed.diceCount || parsed.diceType) {
        form.setValue(
          charPath(`${base}.healingDetails`),
          { diceCount: parsed.diceCount, diceType: parsed.diceType, bonus: parsed.bonus } as PathValue<
            Character,
            Path<Character>
          >,
          { shouldDirty: true },
        );
      }
    }
  }, [base, damageDetails, form, healingDetails, legacyDamage, legacyHealing]);

  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ListFormSection title={tMagic("formSections.general")}>
        <Row className="@md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SpellInput
            form={form}
            path={`${base}.name`}
            id={id("name")}
            label={tEdit("spellName")}
          />
          <SpellInput
            form={form}
            path={`${base}.level`}
            id={id("level")}
            label={tEdit("spellLevelLabel")}
            type="number"
            min={0}
            max={9}
            onValue={(raw) => {
              // The row moves to its new level group; keep the focus in this field.
              requestAnimationFrame(() => {
                const input = levelInputRef.current;
                if (input && document.activeElement !== input) input.focus({ preventScroll: true });
              });
              return raw;
            }}
            inputRef={(element) => {
              levelInputRef.current = element;
            }}
          />
        </Row>
        <Row className="@md:grid-cols-2">
          <Controller
            name={charPath(`${base}.school`)}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical"
                className="min-w-0 gap-1">
                <label
                  htmlFor={id("school")}
                  className={LABEL_CLASS}>
                  {tMagic("spellDetails.school")}
                </label>
                <ComboboxInput
                  id={id("school")}
                  value={(field.value as string | undefined) ?? ""}
                  onChange={field.onChange}
                  suggestions={SPELL_SCHOOLS}
                  placeholder={tMagic("spellDetails.school")}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name={charPath(`${base}.effectType`)}
            control={form.control}
            render={({ field }) => (
              <div className="flex min-w-0 flex-col gap-1">
                <span
                  id={id("effect-type-label")}
                  className={LABEL_CLASS}>
                  {tEdit("spellEffectType")}
                </span>
                <Select
                  value={(field.value as string | undefined) || "utility"}
                  onValueChange={field.onChange}>
                  <SelectTrigger
                    id={id("effect-type")}
                    className="w-full"
                    aria-labelledby={id("effect-type-label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value="utility">{tMagic("effectTypes.utility")}</SelectItem>
                      <SelectItem value="attack">{tMagic("effectTypes.attack")}</SelectItem>
                      <SelectItem value="heal">{tMagic("effectTypes.heal")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </Row>
        {isInnate && (
          <Row className="grid-cols-2">
            <SpellInput
              form={form}
              path={`${base}.usesPerDay`}
              id={id("uses-per-day")}
              label={tMagic("npc.usesPerDayLabel")}
              type="number"
              min={1}
              placeholder={tMagic("npc.atWill")}
              onValue={(raw) => (raw === "" ? null : Number(raw))}
            />
            <SpellInput
              form={form}
              path={`${base}.used`}
              id={id("used")}
              label={tMagic("npc.usedSpellLabel")}
              type="number"
              min={0}
              onValue={(raw) => Number(raw)}
            />
          </Row>
        )}
      </ListFormSection>

      <ListFormSection title={tMagic("formSections.casting")}>
        <Row className="@md:grid-cols-3">
          <SpellInput
            form={form}
            path={`${base}.castingTime`}
            id={id("casting-time")}
            label={tMagic("spellDetails.castingTime")}
          />
          <SpellInput
            form={form}
            path={`${base}.range`}
            id={id("range")}
            label={tMagic("spellDetails.range")}
          />
          <SpellInput
            form={form}
            path={`${base}.duration`}
            id={id("duration")}
            label={tMagic("spellDetails.duration")}
          />
        </Row>
        <Controller
          name={charPath(`${base}.components`)}
          control={form.control}
          render={({ field }) => {
            const components = (field.value as string[] | undefined) ?? [];
            return (
              <fieldset className="flex min-w-0 flex-col gap-1">
                <legend className={LABEL_CLASS}>{tMagic("spellDetails.components")}</legend>
                <div className="mt-1 flex flex-wrap gap-4">
                  {["V", "S", "M"].map((component) => (
                    <div
                      key={component}
                      className="flex items-center gap-2">
                      <Checkbox
                        id={id(`component-${component}`)}
                        checked={components.includes(component)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked ? [...components, component] : components.filter((c) => c !== component),
                          )
                        }
                      />
                      <label
                        htmlFor={id(`component-${component}`)}
                        className="cursor-pointer select-none text-sm font-medium">
                        {component}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            );
          }}
        />
      </ListFormSection>

      <ListFormSection title={tMagic("formSections.effects")}>
        {effectType === "attack" && (
          <div className="flex max-w-40 min-w-0 flex-col gap-1">
            <label
              htmlFor={id("attack-bonus")}
              className={LABEL_CLASS}>
              {tMagic("attackBonus")}
            </label>
            <Input
              id={id("attack-bonus")}
              value={formatSignedBonus(attackBonus)}
              readOnly
              aria-readonly="true"
            />
          </div>
        )}
        <Controller
          name={charPath(`${base}.damageDetails`)}
          control={form.control}
          render={({ field: damageField }) => {
            const damages = coerceSpellDamageDetailsList(damageField.value);
            const updateDamage = (damageIndex: number, key: keyof DamageDetails, value: string | number | null) => {
              const next = [...damages];
              const current = next[damageIndex] ?? { ...EMPTY_SPELL_DAMAGE_DETAILS };
              if (key === "damageType" && typeof value === "string") {
                const normalized = value.trim();
                const duplicated = next.some(
                  (damage, i) =>
                    i !== damageIndex && (damage?.damageType ?? "").trim().toLowerCase() === normalized.toLowerCase(),
                );
                if (normalized && duplicated) return;
                next[damageIndex] = { ...current, damageType: normalized };
              } else {
                next[damageIndex] = { ...current, [key]: value };
              }
              damageField.onChange(next);
            };

            return (
              <div className="flex min-w-0 flex-col gap-2">
                <span className={LABEL_CLASS}>{tEdit("spellDamage")}</span>
                {damages.map((damage, damageIndex) => {
                  const typePath = charPath(`${base}.damageDetails.${damageIndex}.damageType`);
                  const typeState = form.getFieldState(typePath, form.formState);
                  const rowId = id(`damage-${damageIndex}`);
                  return (
                    <DiceFormulaRow
                      key={damageIndex}
                      id={rowId}
                      value={damage}
                      onChange={(key, value) => updateDamage(damageIndex, key, value)}
                      extraText={damage?.damageType}
                      extra={
                        <Field
                          data-invalid={typeState.invalid}
                          orientation="vertical"
                          className="min-w-0 gap-1">
                          <label
                            htmlFor={`${rowId}-type`}
                            className="sr-only">
                            {tEdit("damageType")}
                          </label>
                          <DamageTypeInput
                            id={`${rowId}-type`}
                            value={damage?.damageType ?? ""}
                            onChange={(value) => updateDamage(damageIndex, "damageType", value)}
                            placeholder={tEdit("damageType")}
                            aria-invalid={typeState.invalid}
                            aria-describedby={typeState.error ? `${rowId}-type-error` : undefined}
                          />
                          {typeState.error && (
                            <FieldError
                              id={`${rowId}-type-error`}
                              errors={[typeState.error]}
                            />
                          )}
                        </Field>
                      }
                      trailing={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() =>
                            damageField.onChange(ensureSpellDamageEditRows(damages.filter((_, i) => i !== damageIndex)))
                          }
                          aria-label={tEdit("removeSpellDamage", { index: damageIndex + 1 })}>
                          <Trash2
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      }
                    />
                  );
                })}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => damageField.onChange([...damages, { ...EMPTY_SPELL_DAMAGE_DETAILS }])}
                  aria-label={tEdit("addDamageToSpell")}>
                  <Plus aria-hidden="true" />
                  {tEdit("add")}
                </Button>
              </div>
            );
          }}
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className={LABEL_CLASS}>{tEdit("spellHealing")}</span>
          <Controller
            name={charPath(`${base}.healingDetails`)}
            control={form.control}
            render={({ field }) => {
              const healing = (field.value as HealingDetails | null | undefined) ?? null;
              return (
                <DiceFormulaRow
                  id={id("healing")}
                  value={healing}
                  onChange={(key, value) =>
                    field.onChange({ diceCount: null, diceType: null, bonus: null, ...healing, [key]: value })
                  }
                />
              );
            }}
          />
        </div>
      </ListFormSection>

      <ListFormSection title={tMagic("formSections.description")}>
        <Controller
          name={charPath(`${base}.description`)}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical"
              className="gap-1">
              <label
                htmlFor={id("description")}
                className="sr-only">
                {tMagic("spellDetails.description")}
              </label>
              <Textarea
                {...field}
                value={(field.value as string | undefined) ?? ""}
                id={id("description")}
                rows={5}
                placeholder={tMagic("spellDetails.description")}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </ListFormSection>
    </div>
  );
}
