import { Character } from "@/types/character";
import { Controller, UseFormReturn } from "react-hook-form";
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

interface CharacterInventoryTabEditProps {
  character: Character;
  accentColor: string;
  form: UseFormReturn<any>;
}

export default function CharacterInventoryTabEdit({ character, accentColor, form }: CharacterInventoryTabEditProps) {
  const t = useTranslations("characterDetail.inventory");

  const treasureErrors = form.formState.errors.treasure as any;

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
            <Controller
              name="treasure.pp"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="shrink-0 w-auto"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            className="w-24 pr-8"
                            {...field}
                            value={field.value ?? ""}
                            id="inventory-pp"
                            aria-label={t("platinumPieces")}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                            placeholder={t("platinumPieces")}
                            min={0}
                            type="number"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("platinumPieces")}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Image
                        src={PP}
                        alt=""
                        aria-hidden="true"
                        className="size-4 sm:size-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </Field>
                );
              }}
            />
            <Controller
              name="treasure.gp"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="shrink-0 w-auto"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            className="w-24 pr-8"
                            {...field}
                            value={field.value ?? ""}
                            id="inventory-gp"
                            aria-label={t("goldPieces")}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                            placeholder={t("goldPieces")}
                            min={0}
                            type="number"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("goldPieces")}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Image
                        src={GP}
                        alt=""
                        aria-hidden="true"
                        className="size-4 sm:size-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </Field>
                );
              }}
            />
            <Controller
              name="treasure.ep"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="shrink-0 w-auto"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            className="w-24 pr-8"
                            {...field}
                            value={field.value ?? ""}
                            id="inventory-ep"
                            aria-label={t("electrumPieces")}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                            placeholder={t("electrumPieces")}
                            type="number"
                            min={0}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("electrumPieces")}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Image
                        src={EP}
                        alt=""
                        aria-hidden="true"
                        className="size-4 sm:size-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </Field>
                );
              }}
            />
            <Controller
              name="treasure.sp"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="shrink-0 w-auto"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            className="w-24 pr-8"
                            {...field}
                            value={field.value ?? ""}
                            id="inventory-sp"
                            aria-label={t("silverPieces")}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                            placeholder={t("silverPieces")}
                            type="number"
                            min={0}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("silverPieces")}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Image
                        src={SP}
                        alt=""
                        aria-hidden="true"
                        className="size-4 sm:size-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </Field>
                );
              }}
            />
            <Controller
              name="treasure.cp"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field
                    className="shrink-0 w-auto"
                    data-invalid={fieldState.invalid}
                    orientation="horizontal">
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            className="w-24 pr-8"
                            {...field}
                            value={field.value ?? ""}
                            id="inventory-cp"
                            aria-label={t("copperPieces")}
                            aria-invalid={fieldState.invalid}
                            aria-describedby={fieldState.error ? "inventory-coins-error" : undefined}
                            placeholder={t("copperPieces")}
                            type="number"
                            min={0}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("copperPieces")}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Image
                        src={CP}
                        alt=""
                        aria-hidden="true"
                        className="size-4 sm:size-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </Field>
                );
              }}
            />
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
