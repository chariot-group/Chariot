import type { BuilderEvaluation, BuilderIssue, EvaluatedPage } from "@/lib/rulesetEngine/types";

/**
 * Breadcrumb and navigation of the step-by-step builder.
 *
 * @see FR-ruleset-character-builder — Web builder UI (Pages and breadcrumb)
 */

export type BreadcrumbStepState = "current" | "complete" | "error" | "unvisited";

export type BreadcrumbStep = {
  key: string;
  label: string;
  state: BreadcrumbStepState;
  /** A visited page can be reopened; a page not yet reached cannot be skipped to. */
  reachable: boolean;
  errorCount: number;
};

const pageIssues = (issues: BuilderIssue[], page: EvaluatedPage) =>
  issues.filter((issue) => issue.severity === "error" && issue.stepId === page.stepId && issue.index === page.index);

export function buildBreadcrumb(
  evaluation: BuilderEvaluation,
  currentKey: string,
  visited: readonly string[],
): BreadcrumbStep[] {
  return evaluation.pages.map((page) => {
    const errorCount = pageIssues(evaluation.issues, page).length;
    const wasVisited = visited.includes(page.key);
    const state: BreadcrumbStepState =
      page.key === currentKey ? "current" : !wasVisited ? "unvisited" : page.complete ? "complete" : "error";
    return {
      key: page.key,
      label: page.breadcrumb,
      state,
      reachable: wasVisited || page.key === currentKey,
      errorCount,
    };
  });
}

/**
 * Current page after an evaluation: the wanted page if it still exists, else the page now at the same position
 * (e.g. a level page removed by a lower target level), else the first page.
 */
export function resolveCurrentPageKey(
  pages: readonly EvaluatedPage[],
  wantedKey: string | null,
  previousKeys: readonly string[] = [],
): string | null {
  if (!pages.length) return null;
  if (wantedKey && pages.some((page) => page.key === wantedKey)) return wantedKey;
  const previousIndex = wantedKey ? previousKeys.indexOf(wantedKey) : -1;
  if (previousIndex >= 0) return pages[Math.min(previousIndex, pages.length - 1)].key;
  return pages[0].key;
}

export function adjacentPageKey(
  pages: readonly EvaluatedPage[],
  currentKey: string,
  direction: "previous" | "next",
): string | null {
  const index = pages.findIndex((page) => page.key === currentKey);
  if (index < 0) return null;
  const target = pages[index + (direction === "next" ? 1 : -1)];
  return target?.key ?? null;
}

/** Pages blocking the end of the builder: every page must be complete (structural errors only). */
export function incompletePages(evaluation: BuilderEvaluation): EvaluatedPage[] {
  return evaluation.pages.filter((page) => !page.complete);
}

/** Pages added or removed by an evaluation (announced to assistive technologies). */
export function diffPageKeys(previous: readonly string[], next: readonly string[]) {
  return {
    added: next.filter((key) => !previous.includes(key)),
    removed: previous.filter((key) => !next.includes(key)),
  };
}

/** Warnings about answers dropped by an upstream change (e.g. a subrace after changing the race). */
export function droppedAnswerIssues(evaluation: BuilderEvaluation): BuilderIssue[] {
  return evaluation.issues.filter((issue) => issue.code === "answer-dropped");
}

/** DOM id prefix of a field on a page (shared by the field components and the « fields to complete » links). */
export function builderFieldDomId(pageKey: string, fieldId: string): string {
  return `builder-${pageKey.replace(/[^A-Za-z0-9_-]/g, "-")}-${fieldId}`;
}

export type PageErrorField = { fieldId: string; label: string; domId: string };

/**
 * Fields of a page holding an error (« Next » stays disabled while there is one); count warnings are not errors.
 * @see FR-ruleset-character-builder — Web builder UI (Pages and breadcrumb)
 */
export function pageErrorFields(evaluation: BuilderEvaluation, page: EvaluatedPage): PageErrorField[] {
  const result: PageErrorField[] = [];
  for (const issue of pageIssues(evaluation.issues, page)) {
    const field = page.fields.find((candidate) => candidate.id === issue.fieldId);
    if (!field || result.some((item) => item.fieldId === field.id)) continue;
    const grantLabel = issue.grantId ? field.grants?.find((grant) => grant.id === issue.grantId)?.label : undefined;
    result.push({ fieldId: field.id, label: grantLabel ?? field.label, domId: builderFieldDomId(page.key, field.id) });
  }
  return result;
}
