"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { getNameLabelLength, isNameLabelTooLong, NAME_LABEL_MAX_LENGTH } from "@/lib/nameLabel";

interface NameLabelFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** The API rejected the name (HTTP 400 on `label`). Cleared by the parent on change. */
  serverError?: boolean;
}

/**
 * Group / campaign name input with a `n/50` counter and a field-level length error.
 * @see FR-form-field-validation (Group and campaign names)
 */
export function NameLabelField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled,
  autoFocus,
  serverError = false,
}: NameLabelFieldProps) {
  const t = useTranslations("common.nameLabel");
  const counterId = `${id}-counter`;
  const errorId = `${id}-error`;
  const length = getNameLabelLength(value);
  const invalid = serverError || isNameLabelTooLong(value);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${errorId} ${counterId}` : counterId}
        className="rounded-[15px]"
      />
      <div className="flex items-start gap-2 text-sm">
        {invalid && (
          <FieldError
            id={errorId}
            className="flex items-start gap-1.5">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{t("tooLong", { max: NAME_LABEL_MAX_LENGTH })}</span>
          </FieldError>
        )}
        <p
          id={counterId}
          className={cn("ml-auto shrink-0 tabular-nums", invalid ? "text-destructive" : "text-muted-foreground")}>
          {length}/{NAME_LABEL_MAX_LENGTH}
          <span className="sr-only"> {t("counterUnit")}</span>
        </p>
      </div>
    </div>
  );
}
