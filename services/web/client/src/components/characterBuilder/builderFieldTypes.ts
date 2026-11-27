import type {
  BuilderAnswers,
  BuilderEvaluation,
  BuilderIssue,
  EvaluatedField,
  EvaluatedPage,
} from "@/lib/rulesetEngine/types";

/** Props shared by the field components of the character builder. @see FR-ruleset-character-builder — Web builder UI */
export type BuilderFieldProps = {
  field: EvaluatedField;
  page: EvaluatedPage;
  evaluation: BuilderEvaluation;
  /** Raw answer of the field on this page (`undefined` = the suggestion applies). */
  answer: unknown;
  /** Error and warning issues of the field on this page. */
  issues: BuilderIssue[];
  /** DOM id prefix of the field (label, help, messages). */
  domId: string;
  /**
   * Sets the answer; `undefined` clears it and restores the suggestion. A function receives the latest answer
   * (several updates in a row, e.g. spells confirmed together in the Codex queue).
   */
  onAnswer: (value: unknown | ((current: unknown) => unknown)) => void;
  /** Sets the options chosen for a grant (`grantedChoices`). */
  onGrantAnswer: (grantId: string, keys: string[]) => void;
  /** Label of a catalog entry in the user's locale (falls back to the key). */
  entryLabel: (key: string) => string;
  /** The field sits in a step card with other fields (sub-section instead of its own card). */
  embedded: boolean;
  /** Opens another builder page (summary « Modify »). */
  onGoToPage: (pageKey: string) => void;
  /** Every answer of the builder (summary). */
  answers: BuilderAnswers;
};

export const fieldMessageIds = (domId: string, issues: BuilderIssue[], help?: string) =>
  [help ? `${domId}-help` : null, issues.length ? `${domId}-messages` : null].filter(Boolean).join(" ") || undefined;

export const hasError = (issues: BuilderIssue[]) => issues.some((issue) => issue.severity === "error");
