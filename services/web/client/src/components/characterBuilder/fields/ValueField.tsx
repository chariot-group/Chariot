"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { BuilderCard, RequiredMention } from "@/components/characterBuilder/BuilderCard";
import { BuilderFieldMessages } from "@/components/characterBuilder/BuilderFieldMessages";
import { fieldMessageIds, hasError, type BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { textSuggestions } from "@/lib/characterBuilder/textSuggestions";
import { RULESET_DEFAULT_LOCALE, RULESET_LOCALES, type RulesetLocale } from "@/lib/rulesetEngine/types";

/**
 * `number`, `text` and `computed` fields. A suggested value pre-fills the field and stays editable (except a
 * `locked` computed value); « reset to suggestion » drops the player's answer.
 * @see FR-ruleset-character-builder — Web builder UI (Fields), Suggested values never imposed
 */
export function ValueField({ field, answer, issues, domId, onAnswer, evaluation, embedded }: BuilderFieldProps) {
  const t = useTranslations("characterBuilder");
  const invalid = hasError(issues);
  const describedBy = fieldMessageIds(domId, issues, field.help);
  const isNumber = field.type === "number" || (field.type === "computed" && typeof field.suggestion === "number");
  const answered = answer !== undefined && answer !== null;
  const hasSuggestion = field.suggestion !== null && field.suggestion !== undefined && field.suggestion !== "";
  const userLocale = useLocale();
  const locale: RulesetLocale = (RULESET_LOCALES as readonly string[]).includes(userLocale)
    ? (userLocale as RulesetLocale)
    : RULESET_DEFAULT_LOCALE;
  const suggestions = field.type === "text" ? textSuggestions(field, evaluation.state, locale) : [];
  const multiline = field.config?.multiline === true;
  const min = typeof field.config?.min === "number" ? field.config.min : undefined;
  const max = typeof field.config?.max === "number" ? field.config.max : undefined;
  const value = field.value === null || field.value === undefined ? "" : String(field.value);

  const control = () => {
    if (field.type === "computed" && field.locked) {
      return (
        <output
          id={domId}
          aria-describedby={describedBy}
          className="text-lg font-semibold text-white">
          {value || "—"}
        </output>
      );
    }
    if (isNumber) {
      return (
        <NumberInput
          id={domId}
          inputMode="numeric"
          min={min}
          max={max}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={field.required || undefined}
          value={value}
          onChange={(event) => {
            const raw = event.target.value;
            const parsed = Number(raw);
            onAnswer(raw === "" || !Number.isFinite(parsed) ? undefined : parsed);
          }}
        />
      );
    }
    const common = {
      id: domId,
      "aria-invalid": invalid || undefined,
      "aria-describedby": describedBy,
      "aria-required": field.required || undefined,
      value,
    };
    return multiline ? (
      <Textarea
        {...common}
        rows={4}
        onChange={(event) => onAnswer(event.target.value === "" ? undefined : event.target.value)}
      />
    ) : (
      <Input
        {...common}
        onChange={(event) => onAnswer(event.target.value === "" ? undefined : event.target.value)}
      />
    );
  };

  const body = (
    <div className="flex min-w-0 flex-col gap-2">
      {/* On its own card the card title shows the label; the label stays for the control's accessible name. */}
      <label
        htmlFor={domId}
        className={embedded ? "text-sm font-medium text-white" : "sr-only"}>
        {field.label}
        <RequiredMention
          required={field.required}
          label={t("required")}
        />
      </label>
      {control()}
      {/* Under the field, never next to it: the field keeps its width when the player types. */}
      {answered && hasSuggestion && field.type !== "text" ? (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{t("suggested", { value: String(field.suggestion) })}</span>
          {!field.locked ? (
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-xs text-primary-light"
              onClick={() => onAnswer(undefined)}
              aria-label={`${t("resetSuggestion")} (${t("suggested", { value: String(field.suggestion) })})`}>
              {t("resetSuggestion")}
            </Button>
          ) : null}
        </p>
      ) : null}
      {suggestions.length ? (
        <div
          role="group"
          aria-label={`${t("suggestions")} : ${field.label}`}
          className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              size="sm"
              aria-pressed={value === suggestion}
              className="h-auto max-w-full whitespace-normal py-1.5 text-left text-xs"
              onClick={() => onAnswer(suggestion)}>
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}
      <BuilderFieldMessages
        domId={domId}
        help={field.help}
        issues={issues}
      />
    </div>
  );

  if (embedded) return body;
  return (
    <BuilderCard
      headingId={`${domId}-title`}
      title={field.label}>
      {body}
    </BuilderCard>
  );
}
