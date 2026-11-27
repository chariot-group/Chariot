"use client";

import { useTranslations } from "next-intl";
import { BuilderFieldFrame, RequiredMention } from "@/components/characterBuilder/BuilderCard";
import { BuilderFieldMessages } from "@/components/characterBuilder/BuilderFieldMessages";
import { BuilderOptionList } from "@/components/characterBuilder/fields/BuilderOptionList";
import { fieldMessageIds, hasError, type BuilderFieldProps } from "@/components/characterBuilder/builderFieldTypes";
import { toggleKey } from "@/lib/characterBuilder/builderAnswers";

/**
 * `entitySelect` (single choice) and `multiSelect` (checkboxes with a counter): always a list of option cards,
 * whatever the number of options.
 * @see FR-ruleset-character-builder — Web builder UI (Fields, Layout)
 */
export function EntitySelectField({ field, issues, domId, onAnswer, embedded }: BuilderFieldProps) {
  const t = useTranslations("characterBuilder");
  const options = field.options ?? [];
  const describedBy = fieldMessageIds(domId, issues, field.help);
  const invalid = hasError(issues);
  const multiple = field.type === "multiSelect";
  const headingId = `${domId}-title`;
  const selected = multiple
    ? Array.isArray(field.value)
      ? (field.value as string[])
      : []
    : typeof field.value === "string"
      ? [field.value]
      : [];

  return (
    <BuilderFieldFrame
      embedded={embedded}
      headingId={headingId}
      title={
        <>
          {field.label}
          <RequiredMention
            required={field.required}
            label={t("required")}
          />
        </>
      }
      aside={
        multiple && field.expectedCount !== undefined ? (
          <span aria-label={t("counterLabel", { count: selected.length, expected: field.expectedCount })}>
            {t("counter", { count: selected.length, expected: field.expectedCount })}
          </span>
        ) : undefined
      }>
      <BuilderOptionList
        name={domId}
        options={options}
        selected={selected}
        multiple={multiple}
        labelledBy={headingId}
        describedBy={describedBy}
        invalid={invalid}
        onChange={(key, checked) => onAnswer(multiple ? toggleKey(selected, key, checked) : key)}
      />
      <BuilderFieldMessages
        domId={domId}
        help={field.help}
        issues={issues}
        counts={
          multiple && field.expectedCount !== undefined
            ? { count: selected.length, expected: field.expectedCount }
            : undefined
        }
      />
    </BuilderFieldFrame>
  );
}
