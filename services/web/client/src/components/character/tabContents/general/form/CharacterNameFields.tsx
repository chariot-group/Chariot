import { Controller, type FieldValues, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CharacterNameFieldsProps {
  form: UseFormReturn<FieldValues>;
}

/**
 * First name and last name side by side, nickname on the full width below (stacked when the
 * column next to the avatar is narrow): shared by the PC and NPC « Personnage » edit cards.
 * @see FR-character-general-bento-layout
 */
export default function CharacterNameFields({ form }: CharacterNameFieldsProps) {
  const tEdit = useTranslations("characterDetail.edit");

  return (
    <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
      {/* Prénom */}
      <Controller
        name="firstname"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            orientation="vertical">
            <label
              htmlFor="character-firstname"
              className="text-sm font-medium">
              {tEdit("firstname")}
            </label>
            <Input
              {...field}
              value={field.value || ""}
              id="character-firstname"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "character-firstname-error" : undefined}
              placeholder={tEdit("firstname")}
              type="text"
            />
            {fieldState.error && (
              <FieldError
                id="character-firstname-error"
                errors={[fieldState.error]}
              />
            )}
          </Field>
        )}
      />
      {/* Nom */}
      <Controller
        name="lastname"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            orientation="vertical">
            <label
              htmlFor="character-lastname"
              className="text-sm font-medium">
              {tEdit("lastname")}
            </label>
            <Input
              {...field}
              value={field.value || ""}
              id="character-lastname"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "character-lastname-error" : undefined}
              placeholder={tEdit("lastname")}
              type="text"
            />
            {fieldState.error && (
              <FieldError
                id="character-lastname-error"
                errors={[fieldState.error]}
              />
            )}
          </Field>
        )}
      />
      {/* Surnom */}
      <Controller
        name="surname"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            orientation="vertical"
            className="@sm:col-span-2">
            <label
              htmlFor="character-surname"
              className="text-sm font-medium">
              {tEdit("surname")}
            </label>
            <Input
              {...field}
              value={field.value || ""}
              id="character-surname"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "character-surname-error" : undefined}
              placeholder={tEdit("surname")}
              type="text"
            />
            {fieldState.error && (
              <FieldError
                id="character-surname-error"
                errors={[fieldState.error]}
              />
            )}
          </Field>
        )}
      />
    </div>
  );
}
