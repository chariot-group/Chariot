"use client";

import { AlertCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BuilderIssue } from "@/lib/rulesetEngine/types";

/**
 * Help, errors and warnings of a builder field, linked to its control through `aria-describedby`.
 * Severity is given by an icon and a text, never by color only.
 * @see FR-ruleset-character-builder — Web builder UI (Accessibility)
 */
export function BuilderFieldMessages({
  domId,
  help,
  issues,
  counts,
}: {
  domId: string;
  help?: string;
  issues: BuilderIssue[];
  /** Current and expected counts: count warnings give the numbers. */
  counts?: { count: number; expected: number };
}) {
  const t = useTranslations("characterBuilder");
  const message = (issue: BuilderIssue) => {
    if (counts && issue.code === "count-not-reached") {
      return t("issue.countMissing", { missing: counts.expected - counts.count, expected: counts.expected });
    }
    if (counts && issue.code === "count-exceeded") {
      return t("issue.countExtra", { extra: counts.count - counts.expected, expected: counts.expected });
    }
    return t(`issue.${issue.code}`);
  };
  const unique = issues.filter(
    (issue, index) =>
      issues.findIndex((other) => other.code === issue.code && other.grantId === issue.grantId) === index,
  );
  return (
    <>
      {help ? (
        <p
          id={`${domId}-help`}
          className="text-xs text-muted-foreground sm:text-sm">
          {help}
        </p>
      ) : null}
      {unique.length ? (
        <ul
          id={`${domId}-messages`}
          className="flex flex-col gap-1 text-sm">
          {unique.map((issue) => (
            <li
              key={`${issue.code}-${issue.grantId ?? ""}`}
              className={
                issue.severity === "error"
                  ? "flex items-start gap-2 text-destructive"
                  : "flex items-start gap-2 text-yellow"
              }>
              {issue.severity === "error" ? (
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{message(issue)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
