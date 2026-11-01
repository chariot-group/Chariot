"use client";

import { Controller, type Path, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, Check, Trash2 } from "lucide-react";
import type { Character } from "@/types/character";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";

const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
const LABEL_CLASS = "text-sm font-medium";
const charPath = (path: string) => path as Path<Character>;

interface SpellcastingEditCardProps {
  form: UseFormReturn<Character>;
  accentColor: string;
  className: string;
  isPlayerCharacter: boolean;
  spellcastingIndex: number;
  /** Label of the edited block (remove confirmation). */
  blockLabel: string;
  onRemoveBlock: () => void;
  availableClasses: string[];
  isInnate: boolean;
  abilityKey: string;
  saveDC: number | null;
  attackBonus: number | null;
  calculated: { saveDC: number; attackBonus: number; proficiency: number; modifier: string };
  prepared: { current: number; max: number } | null;
}

/** « Synced » state or one-click alignment on the calculated value (PC). */
function SyncControl({
  synced,
  syncedLabel,
  mismatchLabel,
  actionLabel,
  onSync,
}: {
  synced: boolean;
  syncedLabel: string;
  mismatchLabel: string;
  actionLabel: string;
  onSync: () => void;
}) {
  if (synced) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check
          className="size-3.5 text-green"
          aria-hidden="true"
        />
        {syncedLabel}
      </p>
    );
  }
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <p className="text-xs text-muted-foreground">{mismatchLabel}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onSync}>
        <ArrowRightLeft aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  );
}

/**
 * Spellcasting card, edit mode: class / ability, save DC and attack bonus with their calculated
 * values, prepared count. The block selector sits above the card (CharacterMagicTabEdit).
 * @see FR-character-magic-list-card
 */
export default function SpellcastingEditCard({
  form,
  accentColor,
  className,
  isPlayerCharacter,
  spellcastingIndex: sc,
  blockLabel,
  onRemoveBlock,
  availableClasses,
  isInnate,
  abilityKey,
  saveDC,
  attackBonus,
  calculated,
  prepared,
}: SpellcastingEditCardProps) {
  const tMagic = useTranslations("characterDetail.magic");
  const tEdit = useTranslations("characterDetail.edit");
  const tCommon = useTranslations("characterDetail");
  const tClass = useTranslations("classes");
  const tAbilities = useTranslations("characterDetail.player.general.abilities");
  const base = `spellcasting.${sc}`;

  return (
    <GeneralSectionCard
      headingId="magic-spellcasting-heading"
      title={tMagic("spellcastingTitle")}
      accentColor={accentColor}
      className={className}
      headerAction={
        <ConfirmDialog
          title={tMagic("removeSpellcastingTitle")}
          description={tMagic("removeSpellcastingDescription", { className: blockLabel })}
          confirmLabel={tMagic("removeSpellcastingConfirm")}
          cancelLabel={tCommon("cancel")}
          onConfirm={onRemoveBlock}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-red-500"
            aria-label={tMagic("removeSpellcasting")}>
            <Trash2
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        </ConfirmDialog>
      }>
      {prepared && (
        <p className="text-sm text-muted-foreground">
          {tMagic("preparedSpells")} :{" "}
          <strong className="font-semibold text-foreground tabular-nums">
            {tMagic("preparedSpellsUsage", { current: prepared.current, max: prepared.max })}
          </strong>
        </p>
      )}

      <div className="grid min-w-0 items-start gap-3 @sm:grid-cols-2 @3xl:grid-cols-4">
        {isPlayerCharacter && (
          <Controller
            name={charPath(`${base}.className`)}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical"
                className="min-w-0 gap-1">
                <span
                  id={`sc-${sc}-class-label`}
                  className={LABEL_CLASS}>
                  {tEdit("className")}
                </span>
                <Select
                  value={(field.value as string | undefined) ?? ""}
                  onValueChange={field.onChange}
                  disabled={availableClasses.length === 0}>
                  <SelectTrigger
                    id={`sc-${sc}-class`}
                    className="w-full"
                    aria-labelledby={`sc-${sc}-class-label`}>
                    <SelectValue placeholder={tEdit("selectClass")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {availableClasses.map((name) => (
                        <SelectItem
                          key={name}
                          value={name}>
                          {tClass(name)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {availableClasses.length === 0 && (
                  <p className="text-xs text-muted-foreground">{tMagic("spellcastingClassRequiresClass")}</p>
                )}
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
        <Controller
          name={charPath(`${base}.ability`)}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical"
              className="min-w-0 gap-1">
              <span
                id={`sc-${sc}-ability-label`}
                className={LABEL_CLASS}>
                {tEdit("spellcastingAbility")}
              </span>
              <Select
                value={(field.value as string | undefined) ?? ""}
                onValueChange={field.onChange}>
                <SelectTrigger
                  id={`sc-${sc}-ability`}
                  className="w-full"
                  aria-labelledby={`sc-${sc}-ability-label`}>
                  <SelectValue placeholder={tEdit("spellcastingAbility")} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {ABILITY_KEYS.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}>
                        {tAbilities(key)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {(
          [
            {
              key: "saveDC",
              label: tEdit("spellSaveDC"),
              placeholder: String(calculated.saveDC),
              synced: saveDC === calculated.saveDC,
              syncedLabel: tMagic("saveDCSynced"),
              mismatchLabel: tMagic("saveDCMismatch", {
                calculated: calculated.saveDC,
                prof: calculated.proficiency,
                mod: calculated.modifier,
              }),
              actionLabel: tMagic("syncSaveDC", { dc: calculated.saveDC }),
              value: calculated.saveDC,
            },
            {
              key: "attackBonus",
              label: tEdit("spellAttackBonus"),
              placeholder: `+${calculated.attackBonus}`,
              synced: attackBonus === calculated.attackBonus,
              syncedLabel: tMagic("attackBonusSynced"),
              mismatchLabel: tMagic("attackBonusMismatch", {
                calculated: calculated.attackBonus,
                prof: calculated.proficiency,
                mod: calculated.modifier,
              }),
              actionLabel: tMagic("syncAttackBonus", { bonus: calculated.attackBonus }),
              value: calculated.attackBonus,
            },
          ] as const
        ).map((entry) => (
          <div
            key={entry.key}
            className="flex min-w-0 flex-col gap-1.5">
            <Controller
              name={charPath(`${base}.${entry.key}`)}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="vertical"
                  className="min-w-0 gap-1">
                  <label
                    htmlFor={`sc-${sc}-${entry.key}`}
                    className={LABEL_CLASS}>
                    {entry.label}
                  </label>
                  <Input
                    {...field}
                    value={(field.value as number | string | null | undefined) ?? ""}
                    id={`sc-${sc}-${entry.key}`}
                    type="number"
                    placeholder={entry.placeholder}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {isPlayerCharacter && abilityKey && (
              <SyncControl
                synced={entry.synced}
                syncedLabel={entry.syncedLabel}
                mismatchLabel={entry.mismatchLabel}
                actionLabel={entry.actionLabel}
                onSync={() => form.setValue(charPath(`${base}.${entry.key}`), entry.value, { shouldDirty: true })}
              />
            )}
          </div>
        ))}
      </div>

      {!isPlayerCharacter && (
        <Controller
          name={charPath(`${base}.isInnate`)}
          control={form.control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`sc-${sc}-innate`}
                checked={Boolean(field.value ?? isInnate)}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
              <label
                htmlFor={`sc-${sc}-innate`}
                className="cursor-pointer select-none text-sm">
                {tMagic("displayMode.byUses")}
              </label>
            </div>
          )}
        />
      )}
    </GeneralSectionCard>
  );
}
