"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { makeZodMessages } from "@/lib/zodErrorMap";
import { getPersonNameIssue } from "@/lib/personName";
import { buildNameCorrection, getInvalidNameFields } from "@/lib/accountGate";
import UserService from "@/services/UserService";
import type { PersonNameField, User } from "@/types/user";

type NameFormData = Partial<Record<PersonNameField, string>>;

const AUTOCOMPLETE: Record<PersonNameField, string> = {
  firstName: "given-name",
  lastName: "family-name",
};

interface NameRegularizationStepProps {
  user: User;
  /** Receives the updated user: the gate re-evaluates its steps from it. */
  onSaved: (user: User) => void;
}

/**
 * « Compte irrégulier » step: shows only the offending name fields, pre-filled with the current
 * values, and corrects them through `PUT /users/me` (the API normalizes the case).
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
export default function NameRegularizationStep({ user, onSaved }: NameRegularizationStepProps) {
  const t = useTranslations("AccountGate.name");
  const tEdit = useTranslations("ProfilePage.editProfile");
  const tZod = useTranslations("zodErrors");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Frozen at mount: the fields to correct must not vanish while the user is typing.
  const [fields] = useState<PersonNameField[]>(() => getInvalidNameFields(user));

  const schema = useMemo(() => {
    const zm = makeZodMessages(tZod);
    const personName = z.string().superRefine((value, ctx) => {
      const issue = getPersonNameIssue(value);
      if (issue === "required") ctx.addIssue({ code: "custom", message: zm.required() });
      else if (issue) ctx.addIssue({ code: "custom", message: zm.personName() });
    });
    return z.object(Object.fromEntries(fields.map((field) => [field, personName])));
  }, [fields, tZod]);

  const form = useForm<NameFormData>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((field) => [field, user[field] ?? ""])),
    mode: "onTouched",
  });
  const isSaving = form.formState.isSubmitting;

  // Show right away why each pre-filled value is rejected.
  useEffect(() => {
    void form.trigger();
  }, [form]);

  const onSubmit = async (values: NameFormData) => {
    setSubmitError(null);
    try {
      const updated = await UserService.updateCurrentUser(buildNameCorrection(values, fields));
      onSaved(updated);
    } catch (error) {
      const isNetwork = error instanceof Error && /network|fetch/i.test(error.message);
      setSubmitError(isNetwork ? tEdit("networkError") : tEdit("errorMessage"));
    }
  };

  return (
    <form
      noValidate
      aria-busy={isSaving}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        {fields.map((field) => (
          <Controller
            key={field}
            name={field}
            control={form.control}
            render={({ field: input, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                orientation="vertical">
                <FieldLabel htmlFor={`account-gate-${field}`}>{tEdit(field)}</FieldLabel>
                <Input
                  {...input}
                  value={input.value ?? ""}
                  id={`account-gate-${field}`}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? `account-gate-${field}-error` : undefined}
                  aria-required="true"
                  autoComplete={AUTOCOMPLETE[field]}
                  type="text"
                  disabled={isSaving}
                />
                {fieldState.error && (
                  <FieldError
                    id={`account-gate-${field}-error`}
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      {submitError && (
        <p
          role="alert"
          className="text-destructive text-sm">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full sm:w-auto sm:self-end">
        {isSaving ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
