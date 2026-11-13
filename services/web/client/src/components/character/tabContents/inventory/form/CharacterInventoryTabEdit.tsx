import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import GeneralSectionCard from "@/components/character/tabContents/general/shared/GeneralSectionCard";
import {
  INVENTORY_EDIT_GRID_CLASS,
  INVENTORY_SLOTS,
} from "@/components/character/tabContents/inventory/shared/inventoryBentoLayout";
import { COIN_CONFIG, type CoinKey } from "@/components/character/tabContents/inventory/shared/coins";

interface CharacterInventoryTabEditProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

const TEXT_FIELDS = ["equipment", "treasure"] as const;

/**
 * Inventory tab, edit mode: same cards and zones as read mode.
 * @see FR-character-inventory-bento-layout
 */
export default function CharacterInventoryTabEdit({ accentColor, form }: CharacterInventoryTabEditProps) {
  const t = useTranslations("characterDetail.inventory");

  const treasureErrors = form.formState.errors.treasure as Partial<Record<CoinKey, { message?: string }>> | undefined;
  const coinErrors = COIN_CONFIG.map(({ key }) => treasureErrors?.[key]).filter(Boolean);

  return (
    <div className={INVENTORY_EDIT_GRID_CLASS}>
      <GeneralSectionCard
        headingId="coins-heading"
        title={t("coins")}
        accentColor={accentColor}
        className={INVENTORY_SLOTS.coins}>
        {/* One input per line in a narrow card, one row of five from a wide card (never a partial row). */}
        <div className="grid min-w-0 grid-cols-1 gap-2 @2xl:grid-cols-5 @2xl:gap-3">
          {COIN_CONFIG.map(({ key, icon, labelKey, shortKey }) => {
            const id = `inventory-${key}`;
            return (
              <Controller
                key={key}
                name={`treasure.${key}`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    className="min-w-0 justify-between gap-3 @2xl:flex-col @2xl:items-stretch @2xl:gap-1"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <FieldLabel
                      htmlFor={id}
                      className="min-w-0 items-center text-sm text-muted-foreground">
                      <Image
                        src={icon}
                        alt=""
                        aria-hidden="true"
                        className="size-4 shrink-0 sm:size-5"
                      />
                      <span className="truncate">{t(labelKey)}</span>
                    </FieldLabel>
                    <NumberInput
                      className="w-32 shrink-0 @2xl:w-full"
                      {...field}
                      value={field.value ?? ""}
                      id={id}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                      placeholder={t(shortKey)}
                      min={0}
                    />
                  </Field>
                )}
              />
            );
          })}
        </div>
        {coinErrors.length > 0 && (
          <FieldError
            id="inventory-coins-error"
            errors={coinErrors}
          />
        )}
      </GeneralSectionCard>
      {TEXT_FIELDS.map((key) => {
        const id = `inventory-${key}`;
        return (
          <GeneralSectionCard
            key={key}
            headingId={`${key}-heading`}
            title={t(key)}
            accentColor={accentColor}
            className={INVENTORY_SLOTS[key]}>
            <Controller
              name={`treasure.${key}`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className="flex-1"
                  data-invalid={fieldState.invalid}
                  orientation="vertical">
                  {/* The card heading already names the field. */}
                  <FieldLabel
                    htmlFor={id}
                    className="sr-only">
                    {t(key)}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id={id}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? `${id}-error` : undefined}
                    placeholder={t(key)}
                    className="min-h-36 flex-1 resize-none"
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
          </GeneralSectionCard>
        );
      })}
    </div>
  );
}
