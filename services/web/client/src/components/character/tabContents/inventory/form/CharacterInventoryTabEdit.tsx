import { Controller, UseFormReturn, FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import GP from "@public/assets/pieces/golden-piece.svg";
import SP from "@public/assets/pieces/silver-piece.svg";
import EP from "@public/assets/pieces/electrum-piece.svg";
import PP from "@public/assets/pieces/platinum-piece.svg";
import CP from "@public/assets/pieces/copper-piece.svg";
import { Textarea } from "@/components/ui/textarea";

const COIN_FIELDS = [
  { key: "pp", icon: PP, labelKey: "platinumPieces", placeholderKey: "pp", id: "inventory-pp" },
  { key: "gp", icon: GP, labelKey: "goldPieces", placeholderKey: "gp", id: "inventory-gp" },
  { key: "ep", icon: EP, labelKey: "electrumPieces", placeholderKey: "ep", id: "inventory-ep" },
  { key: "sp", icon: SP, labelKey: "silverPieces", placeholderKey: "sp", id: "inventory-sp" },
  { key: "cp", icon: CP, labelKey: "copperPieces", placeholderKey: "cp", id: "inventory-cp" },
] as const;

interface CharacterInventoryTabEditProps {
  accentColor: string;
  form: UseFormReturn<FieldValues>;
}

export default function CharacterInventoryTabEdit({ accentColor, form }: CharacterInventoryTabEditProps) {
  const t = useTranslations("characterDetail.inventory");

  const treasureErrors = form.formState.errors.treasure as
    | Partial<Record<"pp" | "gp" | "ep" | "sp" | "cp", { message?: string }>>
    | undefined;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-2 md:gap-4 items-start">
      <div className="flex flex-col gap-2 md:gap-4 w-full lg:w-2/5">
        <Card
          className="gap-3 py-4 px-4 md:px-6"
          role="region"
          aria-labelledby="coins-heading">
          <h2
            id="coins-heading"
            className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
            {t("coins")}
          </h2>
          <div
            className="flex flex-wrap gap-2 "
            role="group"
            aria-label={t("coins")}>
            {COIN_FIELDS.map(({ key, icon, labelKey, placeholderKey, id }) => (
              <Controller
                key={key}
                name={`treasure.${key}`}
                control={form.control}
                render={({ field, fieldState }) => {
                  return (
                    <Field
                      className="shrink-0 w-auto"
                      data-invalid={fieldState.invalid}
                      orientation="horizontal">
                      <div className="relative w-28">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              className="w-full pl-8"
                              {...field}
                              value={field.value ?? ""}
                              id={id}
                              aria-label={t(labelKey)}
                              aria-invalid={fieldState.invalid}
                              aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                              placeholder={t(placeholderKey)}
                              min={0}
                              type="number"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t(labelKey)}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Image
                          src={icon}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 sm:size-5"
                        />
                      </div>
                    </Field>
                  );
                }}
              />
            ))}
          </div>
          {(treasureErrors?.pp ||
            treasureErrors?.gp ||
            treasureErrors?.ep ||
            treasureErrors?.sp ||
            treasureErrors?.cp) && (
            <FieldError
              id="inventory-coins-error"
              errors={[
                treasureErrors?.pp,
                treasureErrors?.gp,
                treasureErrors?.ep,
                treasureErrors?.sp,
                treasureErrors?.cp,
              ].filter(Boolean)}
            />
          )}
        </Card>
        <Card
          className="gap-3 py-4 px-4 md:px-6"
          role="region"
          aria-labelledby="equipment-heading">
          <h2
            id="equipment-heading"
            className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
            {t("equipment")}
          </h2>
          <Controller
            name="treasure.equipment"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <FieldLabel htmlFor="inventory-equipment">{t("equipment")}</FieldLabel>
                <Textarea
                  {...field}
                  id="inventory-equipment"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? "inventory-equipment-error" : undefined}
                  placeholder={t("equipment")}
                />
                {fieldState.error && (
                  <FieldError
                    id="inventory-equipment-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </Card>
      </div>
      <Card
        className="w-full lg:min-w-3/5 lg:max-w-3/5 gap-3 py-4 px-4 md:px-6"
        role="region"
        aria-labelledby="treasure-heading">
        <h2
          id="treasure-heading"
          className={`text-xl md:text-2xl font-semibold ${accentColor}`}>
          {t("treasure")}
        </h2>
        <Controller
          name="treasure.treasure"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              orientation="vertical">
              <FieldLabel htmlFor="inventory-treasure">{t("treasure")}</FieldLabel>
              <Textarea
                {...field}
                id="inventory-treasure"
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? "inventory-treasure-error" : undefined}
                placeholder={t("treasure")}
              />
              {fieldState.error && (
                <FieldError
                  id="inventory-treasure-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </Card>
    </div>
  );
}
