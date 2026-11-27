import { allocationValue } from "@/lib/rulesetEngine/allocation";
import {
  buildCatalog,
  buildLabels,
  entryId,
  isEmpty,
  mergeAnswers,
  toCount,
  translate,
  type Catalog,
} from "@/lib/rulesetEngine/catalog";
import { applyEffect, replaceKeyPlaceholder } from "@/lib/rulesetEngine/effects";
import { evaluateExpression, isTruthy } from "@/lib/rulesetEngine/expressions";
import { cloneJson, getPath, isPlainObject, jsonEquals, setPath, type JsonObject } from "@/lib/rulesetEngine/paths";
import {
  type AbilityAllocationAnswer,
  type BuilderAnswers,
  type BuilderContext,
  type BuilderEvaluation,
  type BuilderField,
  type BuilderInput,
  type BuilderIssue,
  type BuilderStep,
  type EntryEffect,
  type EntryGrant,
  type EvaluatedField,
  type EvaluatedGrant,
  type EvaluatedPage,
  type ResolvedEntry,
  type RulesetAttachment,
  type RulesetCollection,
  type RulesetEntry,
  type RulesetLocale,
} from "@/lib/rulesetEngine/types";

/**
 * Generic, game-system agnostic evaluation of a data-driven character builder.
 * Pure and synchronous: the UI calls it on every input.
 *
 * @see FR-ruleset-character-builder — Builder engine
 */

/** Passes allowed for the state of one page to become stable. */
export const MAX_PAGE_PASSES = 10;
/** Pages generated at most by one repeated step. */
export const MAX_REPEAT_PAGES = 100;
/** Nesting allowed for options chosen through grants (grant of a granted option…). */
const MAX_GRANT_DEPTH = 8;

type Recorded<T> = { index?: number; value: T };

/** Where an entry was first selected: `self.field` (and `self.grant` for an option chosen through a grant). */
type SelectionSource = { field: string; grant?: string };

/** What the pages already processed produced. */
type Progress = {
  effects: JsonObject;
  fieldValues: Record<string, Recorded<unknown>[]>;
  fieldEntries: Record<string, Recorded<ResolvedEntry | ResolvedEntry[] | null>[]>;
  choices: Record<string, ResolvedEntry[]>;
  selected: Record<string, ResolvedEntry[]>;
  applied: string[];
  offered: string[];
  /** Options chosen per offer key (chain of choices that offered the grant). */
  offers: Record<string, ResolvedEntry[]>;
  sources: Record<string, SelectionSource>;
  /** Effects applied on the page being processed (`state.page`). */
  pageEffects: JsonObject;
  /** Spells chosen per `spellSelect` field (and page), with their group (`state.spells`). */
  spellPicks: Record<string, Recorded<{ group: string; spells: unknown[] }>[]>;
};

/**
 * Copy of the progress for one pass: what passes mutate in place (effects, applied and offered lists) is copied,
 * the rest is replaced, never mutated, so it is shared.
 */
function cloneProgress(progress: Progress): Progress {
  return {
    ...progress,
    effects: cloneJson(progress.effects),
    pageEffects: cloneJson(progress.pageEffects),
    fieldValues: { ...progress.fieldValues },
    fieldEntries: { ...progress.fieldEntries },
    choices: { ...progress.choices },
    selected: { ...progress.selected },
    applied: [...progress.applied],
    offered: [...progress.offered],
    offers: { ...progress.offers },
    sources: { ...progress.sources },
    spellPicks: { ...progress.spellPicks },
  };
}

/** Copies the containers and the entry objects (not their data) of `state.entries` / `choices` / `selected`. */
function copyEntries(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(copyEntries);
  if (!isPlainObject(node)) return node;
  if (typeof node.type === "string" && typeof node.key === "string") return { ...node };
  return Object.fromEntries(Object.entries(node).map(([name, child]) => [name, copyEntries(child)]));
}

type PageRef = { step: BuilderStep; index?: number; repeat: Record<string, unknown> };

function record<T>(list: Recorded<T>[] | undefined, index: number | undefined, value: T): Recorded<T>[] {
  const next = (list ?? []).filter((item) => item.index !== index);
  next.push(index === undefined ? { value } : { index, value });
  return next.sort((a, b) => (a.index ?? -Infinity) - (b.index ?? -Infinity));
}

class BuilderEngine {
  private readonly catalog: Catalog;
  private readonly answers: BuilderAnswers;
  private readonly locale: RulesetLocale;
  private readonly fieldSteps = new Map<string, BuilderStep>();
  private progress: Progress = {
    effects: {},
    fieldValues: {},
    fieldEntries: {},
    choices: {},
    selected: {},
    applied: [],
    offered: [],
    offers: {},
    sources: {},
    pageEffects: {},
    spellPicks: {},
  };
  private readonly levels = new Map<string, unknown>();
  private readonly attachments = new Map<string, RulesetAttachment[]>();
  private readonly pages: EvaluatedPage[] = [];
  private readonly issues: BuilderIssue[] = [];

  constructor(private readonly input: BuilderInput) {
    this.locale = input.context.locale;
    this.catalog = buildCatalog(input.entries, this.locale);
    this.answers = mergeAnswers(input.savedAnswers, input.answers);
    for (const step of input.ruleset.flow.steps) {
      for (const field of step.fields) this.fieldSteps.set(field.id, step);
    }
    for (const level of input.ruleset.levels ?? []) this.levels.set(level.type, level.expression);
    for (const attachment of input.ruleset.attachments ?? []) {
      this.attachments.set(attachment.parentType, [...(this.attachments.get(attachment.parentType) ?? []), attachment]);
    }
  }

  run(): BuilderEvaluation {
    const steps = [...this.input.ruleset.flow.steps].sort((a, b) => a.order - b.order);
    const { context } = this.input;
    if (context.mode === "levelUp") {
      // Replay the saved creation and previous level-ups (hidden), then show the level-up pages.
      const replay: BuilderContext = { ...context, mode: "creation", targetLevel: context.currentLevel };
      this.runSteps(steps, replay, false);
    }
    this.runSteps(steps, context, true);

    const finalState = this.composeState(this.progress);
    const state: JsonObject = cloneJson(finalState);
    const scope = this.createScope({ state: finalState, context });
    const formulas: JsonObject = {};
    for (const formula of this.input.ruleset.formulas ?? []) {
      const result = evaluateExpression(formula.expression, scope);
      if (!result.ok) {
        this.addIssue({ code: "expression-error", severity: "error", formulaId: formula.id, message: result.error });
      }
      formulas[formula.id] = result.ok ? result.value : null;
    }
    const sheet: JsonObject = {};
    for (const projection of this.input.ruleset.projection ?? []) {
      const result = evaluateExpression(projection.source, scope);
      if (!result.ok) {
        this.addIssue({
          code: "expression-error",
          severity: "error",
          message: `${projection.target}: ${result.error}`,
        });
        continue;
      }
      if (result.value !== undefined && result.value !== null)
        setPath(sheet, projection.target, cloneJson(result.value));
    }
    for (const collection of this.input.ruleset.collections ?? [])
      state[collection.id] = cloneJson(finalState[collection.id]);
    return {
      pages: this.pages,
      state,
      formulas,
      sheet,
      issues: this.issues,
    };
  }

  private runSteps(steps: BuilderStep[], context: BuilderContext, shown: boolean) {
    for (const step of steps.filter((candidate) => candidate.modes.includes(context.mode))) {
      for (const page of this.expandStep(step, context, shown)) this.processPage(page, context, shown);
    }
  }

  private expandStep(step: BuilderStep, context: BuilderContext, shown: boolean): PageRef[] {
    if (!step.repeat) return [{ step, repeat: {} }];
    const scope = this.createScope({ state: this.composeState(this.progress), context });
    const from = evaluateExpression(step.repeat.from, scope);
    const to = evaluateExpression(step.repeat.to, scope);
    const start = from.ok ? toCount(from.value) : undefined;
    const end = to.ok ? toCount(to.value) : undefined;
    if (start === undefined || end === undefined) {
      if (shown) {
        this.addIssue({
          code: "invalid-repeat",
          severity: "error",
          stepId: step.id,
          message: from.ok ? undefined : from.error,
        });
      }
      return [];
    }
    const pages: PageRef[] = [];
    for (let index = start; index <= end && pages.length < MAX_REPEAT_PAGES; index += 1) {
      pages.push({ step, index, repeat: { index } });
    }
    return pages;
  }

  private processPage(page: PageRef, context: BuilderContext, shown: boolean) {
    const base: Progress = { ...this.progress, pageEffects: {} };
    const visibility = this.createScope({ state: this.composeState(base), context, repeat: page.repeat });
    if (page.step.visibleWhen !== undefined) {
      const visible = evaluateExpression(page.step.visibleWhen, visibility);
      if (!visible.ok && shown) {
        this.addIssue({ code: "expression-error", severity: "error", stepId: page.step.id, message: visible.error });
      }
      if (!visible.ok || !isTruthy(visible.value)) return;
    }

    let previousValues = new Map<string, unknown>();
    let previousEntries = new Map<string, ResolvedEntry | ResolvedEntry[] | null>();
    // States are compared as JSON taken before a scope decorates them with lazy getters.
    let previousState = this.composeState(base, page, previousEntries);
    let previousJson = JSON.stringify(previousState);
    let result: PassResult | undefined;
    let stable = false;
    for (let pass = 0; pass < MAX_PAGE_PASSES; pass += 1) {
      result = this.runPass(page, context, base, previousState, previousValues, previousEntries);
      const nextState = this.composeState(result.progress, page, result.pageEntries);
      const nextJson = JSON.stringify(nextState);
      if (nextJson === previousJson && jsonEquals([...result.pageValues], [...previousValues])) {
        stable = true;
        break;
      }
      previousState = nextState;
      previousJson = nextJson;
      previousValues = result.pageValues;
      previousEntries = result.pageEntries;
    }
    if (!result) return;
    this.progress = result.progress;
    if (!shown) return;

    const pageIssues = [...result.issues];
    if (!stable) {
      pageIssues.push({ code: "unstable-state", severity: "error", stepId: page.step.id, index: page.index });
    }
    pageIssues.forEach((issue) => this.addIssue(issue));
    this.pages.push({
      key: page.index === undefined ? page.step.id : `${page.step.id}:${page.index}`,
      stepId: page.step.id,
      ...(page.index !== undefined ? { index: page.index } : {}),
      title: translate(page.step.title, this.locale, page.repeat) ?? page.step.id,
      breadcrumb: translate(page.step.breadcrumb, this.locale, page.repeat) ?? page.step.id,
      ...(page.step.description ? { description: translate(page.step.description, this.locale, page.repeat) } : {}),
      fields: result.fields,
      cards: (page.step.cards ?? []).map((card) => ({
        id: card.id,
        title: translate(card.title, this.locale, page.repeat) ?? card.id,
        ...(card.description ? { description: translate(card.description, this.locale, page.repeat) } : {}),
        fields: card.fields,
      })),
      complete: !pageIssues.some((issue) => issue.severity === "error"),
    });
  }

  private runPass(
    page: PageRef,
    context: BuilderContext,
    base: Progress,
    state: JsonObject,
    previousValues: Map<string, unknown>,
    previousEntries: Map<string, ResolvedEntry | ResolvedEntry[] | null>,
  ): PassResult {
    const work = cloneProgress(base);
    const pass: PassResult = {
      progress: work,
      pageValues: new Map(),
      pageEntries: new Map(),
      fields: [],
      issues: [],
    };
    const scope = this.createScope({
      state,
      context,
      repeat: page.repeat,
      page,
      pageValues: pass.pageValues,
      previousValues,
    });
    const issue = (fieldId: string, code: BuilderIssue["code"], severity: BuilderIssue["severity"], extra = {}) =>
      pass.issues.push({
        code,
        severity,
        stepId: page.step.id,
        fieldId,
        ...(page.index !== undefined ? { index: page.index } : {}),
        ...extra,
      });
    const evaluate = (fieldId: string, expression: unknown, data: object = scope): unknown => {
      const result = evaluateExpression(expression, data);
      if (!result.ok) {
        issue(fieldId, "expression-error", "error", { message: result.error });
        return null;
      }
      return result.value;
    };

    // Entries selected on previous pages may reach the level of new children on this page.
    this.attachReachedChildren(work, scope);
    for (const field of page.step.fields) {
      if (field.visibleWhen !== undefined && !isTruthy(evaluate(field.id, field.visibleWhen))) {
        pass.pageValues.set(field.id, null);
        continue;
      }
      const evaluated = this.evaluateField(field, page, scope, work, pass, evaluate, issue, previousEntries);
      pass.pageValues.set(field.id, evaluated.value);
      work.fieldValues[field.id] = record(work.fieldValues[field.id], page.index, evaluated.value);
      pass.fields.push(evaluated);

      if (evaluated.required && this.isMissing(field, evaluated.value)) issue(field.id, "required", "error");
      if (
        field.validation !== undefined &&
        !isEmpty(evaluated.value) &&
        !isTruthy(evaluate(field.id, field.validation))
      ) {
        issue(field.id, "validation-failed", "error");
      }
    }
    this.attachReachedChildren(work, scope);
    for (const fieldId of pass.pageEntries.keys()) {
      work.fieldEntries[fieldId] = record(
        work.fieldEntries[fieldId],
        page.index,
        pass.pageEntries.get(fieldId) ?? null,
      );
    }
    return pass;
  }

  private isMissing(field: BuilderField, value: unknown): boolean {
    if (field.type !== "abilityAllocation") return isEmpty(value);
    return !isPlainObject(value) || Object.keys(value).length <= 1;
  }

  private evaluateField(
    field: BuilderField,
    page: PageRef,
    scope: object,
    work: Progress,
    pass: PassResult,
    evaluate: (fieldId: string, expression: unknown, data?: object) => unknown,
    issue: IssueReporter,
    previousEntries: Map<string, ResolvedEntry | ResolvedEntry[] | null>,
  ): EvaluatedField {
    const raw = this.rawAnswer(field.id, page);
    const answered = raw !== undefined && raw !== null;
    const required = field.requiredWhen !== undefined && isTruthy(evaluate(field.id, field.requiredWhen));
    const locked = field.locked === true;
    const suggestion =
      field.type === "computed"
        ? evaluate(field.id, field.formula)
        : field.default !== undefined
          ? evaluate(field.id, field.default)
          : undefined;
    const evaluated: EvaluatedField = {
      id: field.id,
      type: field.type,
      label: translate(field.label, this.locale, page.repeat) ?? field.id,
      ...(field.help ? { help: translate(field.help, this.locale, page.repeat) } : {}),
      required,
      locked,
      suggestion: suggestion ?? null,
      value: null,
      answered,
      ...(field.config ? { config: field.config } : {}),
    };

    switch (field.type) {
      case "entitySelect":
      case "multiSelect": {
        const options = this.fieldOptions(field, scope, evaluate);
        evaluated.options = options.map((option) => this.withValues(option, scope));
        const optionKeys = new Set(options.map((option) => option.key));
        const check = (key: unknown, report: boolean): ResolvedEntry | null => {
          if (typeof key !== "string") {
            if (report) issue(field.id, "invalid-value", "error");
            return null;
          }
          if (optionKeys.has(key)) return options.find((option) => option.key === key) ?? null;
          if (report) {
            const known = (this.catalog.byType.get(field.source?.type ?? "") ?? []).some((entry) => entry.key === key);
            issue(field.id, known ? "answer-dropped" : "unknown-entry", known ? "warning" : "error", { message: key });
          }
          return null;
        };
        if (field.type === "entitySelect") {
          // A single option is the obvious suggestion when the field declares none.
          const fallback = suggestion ?? (options.length === 1 ? options[0].key : undefined);
          if (suggestion === undefined && fallback !== undefined) evaluated.suggestion = fallback;
          const entry =
            (answered ? check(raw, true) : null) ?? (fallback !== undefined ? check(fallback, false) : null);
          evaluated.value = entry?.key ?? null;
          pass.pageEntries.set(field.id, entry);
          if (entry) this.applyEntry(entry, work, scope, { field: field.id });
        } else {
          const keys = answered ? (Array.isArray(raw) ? raw : [raw]) : Array.isArray(suggestion) ? suggestion : [];
          const chosen = keys
            .map((key) => check(key, answered))
            .filter((entry): entry is ResolvedEntry => entry !== null);
          evaluated.value = chosen.map((entry) => entry.key);
          pass.pageEntries.set(field.id, chosen);
          chosen.forEach((entry) => this.applyEntry(entry, work, scope, { field: field.id }));
          this.countIssues(field, evaluated, chosen.length, evaluate, issue);
        }
        break;
      }
      case "grantedChoices": {
        const owners = this.ownersOf(field.from, page, pass, previousEntries);
        const answer = isPlainObject(raw) ? (raw as Record<string, unknown>) : {};
        const grants: EvaluatedGrant[] = [];
        const value: Record<string, string[]> = {};
        const visited = new Set<string>();
        /** `chain` identifies how the owner was reached, so a repeatable option offers its grants again. */
        const visit = (owner: ResolvedEntry, depth: number, chain: string) => {
          const source = this.catalog.get(owner.type, owner.key);
          const ownerChain = `${chain}/${entryId(owner)}`;
          if (!source || depth > MAX_GRANT_DEPTH || visited.has(ownerChain)) return;
          visited.add(ownerChain);
          const ownerScope = this.selfScope(scope, owner, work.sources[entryId(owner)]);
          const ownerLevel = this.declaredLevel(owner, scope);
          for (const grant of source.grants ?? []) {
            const offerKey = `${ownerChain}:${grant.id}`;
            if (work.offered.includes(offerKey)) {
              // Offered on a previous page: its options may now offer their own grants or children.
              (work.offers[offerKey] ?? []).forEach((option) => visit(option, depth + 1, offerKey));
              continue;
            }
            if (grant.level !== undefined && ownerLevel !== undefined && ownerLevel < grant.level) continue;
            if (grant.when !== undefined && !isTruthy(evaluate(field.id, grant.when, ownerScope))) continue;
            work.offered.push(offerKey);
            const options = this.grantOptions(grant.from);
            const expectedCount = toCount(evaluate(field.id, grant.count, ownerScope)) ?? 0;
            const rawChoice = answer[grant.id];
            const suggestedKeys = this.grantSuggestion(grant, options, expectedCount, (expression) =>
              evaluate(field.id, expression, ownerScope),
            );
            // No answer: the obvious choice (or the grant default) applies as a suggestion; an explicit `[]` stays empty.
            const suggested = rawChoice === undefined || rawChoice === null;
            const keys = suggested ? suggestedKeys : Array.isArray(rawChoice) ? rawChoice : [rawChoice];
            const chosen: ResolvedEntry[] = [];
            for (const key of keys) {
              const option = options.find((candidate) => candidate.key === key);
              if (option) {
                if (!chosen.includes(option)) chosen.push(option);
                continue;
              }
              const known = typeof key === "string" && this.catalog.byKey.has(key);
              issue(field.id, known ? "answer-dropped" : "unknown-entry", known ? "warning" : "error", {
                grantId: grant.id,
                message: String(key),
              });
            }
            if (chosen.length < expectedCount) issue(field.id, "count-not-reached", "warning", { grantId: grant.id });
            if (chosen.length > expectedCount) issue(field.id, "count-exceeded", "warning", { grantId: grant.id });
            work.choices[grant.id] = chosen;
            work.offers[offerKey] = chosen;
            value[grant.id] = chosen.map((option) => option.key);
            grants.push({
              key: offerKey,
              id: grant.id,
              ...(grant.label ? { label: translate(grant.label, this.locale) } : {}),
              ...(grant.description ? { description: translate(grant.description, this.locale) } : {}),
              suggested: suggested && chosen.length > 0,
              ownerKey: owner.key,
              ownerLabel: owner.label,
              options: options.map((option) => this.withValues(option, scope)),
              expectedCount,
              chosen: value[grant.id],
            });
            for (const option of chosen) {
              this.applyEffects(replaceKeyPlaceholder(grant.effects ?? [], option.key), work, ownerScope);
              this.applyEntry(option, work, scope, { field: field.id, grant: grant.id });
              visit(option, depth + 1, offerKey);
            }
          }
          this.attachedChildren(owner, work).forEach((child) => visit(child, depth + 1, ownerChain));
        };
        owners.forEach((owner) => visit(owner, 0, ""));
        // Choices of a grant no longer offered (e.g. the dwarf subrace after choosing an elf) are dropped: a warning
        // (announced by the view), never applied. An explicit `[]` is not a choice.
        const offeredIds = new Set(grants.map((grant) => grant.id));
        for (const [grantId, rawChoice] of Object.entries(answer)) {
          const keys = rawChoice === undefined || rawChoice === null ? [] : [rawChoice].flat();
          if (offeredIds.has(grantId) || !keys.length) continue;
          issue(field.id, "answer-dropped", "warning", { grantId, message: keys.map(String).join(", ") });
        }
        evaluated.grants = grants;
        evaluated.value = value;
        break;
      }
      case "abilityAllocation":
        evaluated.methods = field.methods ?? [];
        evaluated.value = allocationValue(field, raw, answered, (code, severity) => issue(field.id, code, severity));
        break;
      case "number":
      case "text": {
        const expected = field.type === "number" ? "number" : "string";
        if (answered && typeof raw !== expected) issue(field.id, "invalid-value", "error");
        evaluated.value = answered && typeof raw === expected ? raw : (suggestion ?? null);
        break;
      }
      case "computed": {
        const valid = answered && ["number", "string", "boolean"].includes(typeof raw);
        evaluated.value = !locked && valid ? raw : (suggestion ?? null);
        break;
      }
      case "spellSelect": {
        const spells = answered ? (Array.isArray(raw) ? raw : [raw]) : [];
        const valid = spells.filter(
          (spell) => isPlainObject(spell) && typeof spell.name === "string" && typeof spell.level === "number",
        );
        if (valid.length !== spells.length) issue(field.id, "invalid-value", "error");
        evaluated.value = valid;
        if (field.spellFilter) {
          evaluated.spellFilter = {
            className: evaluate(field.id, field.spellFilter.className),
            minLevel: evaluate(field.id, field.spellFilter.minLevel),
            maxLevel: evaluate(field.id, field.spellFilter.maxLevel),
          };
        }
        this.countIssues(field, evaluated, valid.length, evaluate, issue);
        const group =
          field.spellGroup !== undefined ? evaluate(field.id, field.spellGroup) : evaluated.spellFilter?.className;
        work.spellPicks[field.id] = record(work.spellPicks[field.id], page.index, {
          group: group === undefined || group === null || group === "" ? field.id : String(group),
          spells: valid,
        });
        break;
      }
      case "summary":
        break;
    }
    evaluated.answered = answered && evaluated.value !== null;
    return evaluated;
  }

  private countIssues(
    field: BuilderField,
    evaluated: EvaluatedField,
    count: number,
    evaluate: (fieldId: string, expression: unknown) => unknown,
    issue: IssueReporter,
  ) {
    evaluated.count = count;
    if (field.count === undefined) return;
    const expected = toCount(evaluate(field.id, field.count));
    if (expected === undefined) return;
    evaluated.expectedCount = expected;
    if (count < expected) issue(field.id, "count-not-reached", "warning");
    if (count > expected) issue(field.id, "count-exceeded", "warning");
  }

  private fieldOptions(
    field: BuilderField,
    scope: object,
    evaluate: (fieldId: string, expression: unknown, data?: object) => unknown,
  ): ResolvedEntry[] {
    if (!field.source) return [];
    const candidates = (this.catalog.byType.get(field.source.type) ?? []).filter(
      (entry) => field.source?.parentKey === undefined || entry.parentKey === field.source.parentKey,
    );
    return candidates
      .map((entry) => this.catalog.resolve(entry))
      .filter((option) => {
        if (field.optionsFilter === undefined) return true;
        const optionScope = Object.create(scope) as JsonObject;
        optionScope.option = this.expose(option, scope);
        return isTruthy(evaluate(field.id, field.optionsFilter, optionScope));
      });
  }

  /**
   * Suggested options of a grant without answer: its `default` (keys, or JSON Logic giving keys), else every option
   * when there are not more options than the expected count (the obvious choice).
   */
  private grantSuggestion(
    grant: EntryGrant,
    options: ResolvedEntry[],
    expectedCount: number,
    evaluate: (expression: unknown) => unknown,
  ): string[] {
    if (grant.default !== undefined) {
      const value = evaluate(grant.default);
      const keys = (Array.isArray(value) ? value : [value]).filter((key): key is string => typeof key === "string");
      return keys.filter((key) => options.some((option) => option.key === key));
    }
    return options.length > 0 && options.length <= expectedCount ? options.map((option) => option.key) : [];
  }

  private grantOptions(from: { type: string; parentKey?: string; keys?: string[] }): ResolvedEntry[] {
    const candidates = (this.catalog.byType.get(from.type) ?? []).filter(
      (entry) => from.parentKey === undefined || entry.parentKey === from.parentKey,
    );
    if (!from.keys) return candidates.map((entry) => this.catalog.resolve(entry));
    return from.keys
      .map((key) => candidates.find((entry) => entry.key === key))
      .filter((entry): entry is RulesetEntry => entry !== undefined)
      .map((entry) => this.catalog.resolve(entry));
  }

  /** Entries chosen in the `from` field of a `grantedChoices` field. */
  private ownersOf(
    fromFieldId: string | undefined,
    page: PageRef,
    pass: PassResult,
    previousEntries: Map<string, ResolvedEntry | ResolvedEntry[] | null>,
  ): ResolvedEntry[] {
    if (!fromFieldId) return [];
    const onPage = page.step.fields.some((field) => field.id === fromFieldId);
    const value = onPage
      ? pass.pageEntries.has(fromFieldId)
        ? pass.pageEntries.get(fromFieldId)
        : previousEntries.get(fromFieldId)
      : (this.progress.fieldEntries[fromFieldId] ?? []).flatMap((item) => item.value ?? []);
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Records an entry as selected, applies its own effects once (first selection), then attaches its
   * children whose level is reached.
   */
  private applyEntry(entry: ResolvedEntry, work: Progress, scope: object, source: SelectionSource) {
    const id = entryId(entry);
    const selected = work.selected[entry.type] ?? [];
    if (!selected.some((item) => item.key === entry.key)) work.selected[entry.type] = [...selected, entry];
    work.sources[id] ??= source;
    if (!work.applied.includes(id)) {
      work.applied.push(id);
      const effects = this.catalog.get(entry.type, entry.key)?.effects ?? [];
      this.applyEffects(effects, work, this.selfScope(scope, entry, work.sources[id]));
    }
    this.attachChildren(entry, work, scope);
  }

  /** Attaches the children (`attachments`) of a selected entry whose `level` the parent reached. */
  private attachChildren(parent: ResolvedEntry, work: Progress, scope: object) {
    const declarations = this.attachments.get(parent.type);
    if (!declarations) return;
    const parentLevel = this.declaredLevel(parent, scope);
    for (const attachment of declarations) {
      const children = (this.catalog.byType.get(attachment.childType) ?? [])
        .filter((child) => child.parentKey === parent.key)
        .filter((child) => child.level === undefined || parentLevel === undefined || child.level <= parentLevel)
        .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.key.localeCompare(b.key));
      for (const child of children) {
        const resolved = this.catalog.resolve(child);
        if (work.applied.includes(entryId(resolved))) continue;
        if (attachment.when !== undefined) {
          const when = evaluateExpression(attachment.when, this.selfScope(scope, resolved));
          if (!when.ok || !isTruthy(when.value)) continue;
        }
        this.applyEntry(resolved, work, scope, work.sources[entryId(parent)] ?? { field: "" });
      }
    }
  }

  private attachReachedChildren(work: Progress, scope: object) {
    for (const entries of Object.values(work.selected)) {
      [...entries].forEach((entry) => this.attachChildren(entry, work, scope));
    }
  }

  /** Children currently attached to an entry. */
  private attachedChildren(parent: ResolvedEntry, work: Progress): ResolvedEntry[] {
    return (this.attachments.get(parent.type) ?? []).flatMap((attachment) =>
      (work.selected[attachment.childType] ?? []).filter((child) => child.parentKey === parent.key),
    );
  }

  /** Level from the `levels` declaration of the entry type, `undefined` without declaration. */
  private declaredLevel(entry: ResolvedEntry, scope: object): number | undefined {
    const expression = this.levels.get(entry.type);
    if (expression === undefined) return undefined;
    const self = this.expose(entry, scope, {}, false);
    const result = evaluateExpression(expression, this.withRoot(scope, "self", self));
    return result.ok ? toCount(result.value) : undefined;
  }

  /**
   * Entry as read by expressions: `values` (and `level` when its type declares one) are evaluated lazily
   * in the given scope, with `self` = the entry.
   */
  private expose(entry: ResolvedEntry, scope: object, extra: JsonObject = {}, withLevel = true): JsonObject {
    const exposed: JsonObject = { ...entry, ...extra };
    this.decorate(exposed, scope, withLevel);
    return exposed;
  }

  private decorate(target: JsonObject, scope: object, withLevel = true) {
    if (typeof target.type !== "string" || typeof target.key !== "string") return;
    const source = this.catalog.get(target.type, target.key);
    if (!source) return;
    const parent = source.parentKey ? this.catalog.byKey.get(source.parentKey) : undefined;
    Object.defineProperty(target, "parent", {
      configurable: true,
      enumerable: false,
      get: () => (parent ? this.expose(this.catalog.resolve(parent), scope) : null),
    });
    Object.defineProperty(target, "children", {
      configurable: true,
      enumerable: false,
      get: () => {
        const selected = ((scope as JsonObject).state as JsonObject | undefined)?.selected as
          Record<string, ResolvedEntry[]> | undefined;
        return Object.values(selected ?? {})
          .flat()
          .filter((child) => child.parentKey === source.key)
          .map((child) => this.expose(child, scope));
      },
    });
    if (withLevel && this.levels.has(source.type)) {
      const entry = this.catalog.resolve(source);
      Object.defineProperty(target, "level", {
        configurable: true,
        enumerable: false,
        get: () => this.declaredLevel(entry, scope) ?? null,
      });
    }
    if (source.values) {
      let cache: JsonObject | undefined;
      Object.defineProperty(target, "values", {
        configurable: true,
        enumerable: false,
        get: () => {
          if (cache) return cache;
          cache = {};
          const selfScope = this.withRoot(scope, "self", target);
          for (const [name, expression] of Object.entries(source.values ?? {})) {
            Object.defineProperty(cache, name, {
              enumerable: true,
              get: () => {
                const result = evaluateExpression(expression, selfScope);
                return result.ok ? result.value : null;
              },
            });
          }
          return cache;
        },
      });
    }
  }

  /** Option with its `values` evaluated, for the field output. */
  private withValues(option: ResolvedEntry, scope: object): ResolvedEntry {
    const source = this.catalog.get(option.type, option.key);
    if (!source?.values) return option;
    const exposed = this.expose(option, scope);
    return { ...option, values: cloneJson({ ...(exposed.values as JsonObject) }) };
  }

  private selfScope(scope: object, entry: ResolvedEntry, source?: SelectionSource): object {
    return this.withRoot(scope, "self", this.expose(entry, scope, { ...(source ?? {}) }));
  }

  private withRoot(scope: object, root: string, value: unknown): object {
    const child = Object.create(scope) as JsonObject;
    child[root] = value;
    return child;
  }

  private applyEffects(effects: EntryEffect[], work: Progress, scope: object) {
    for (const effect of effects) {
      if (effect.when !== undefined) {
        const when = evaluateExpression(effect.when, scope);
        if (!when.ok || !isTruthy(when.value)) continue;
      }
      if (applyEffect(work.effects, effect)) applyEffect(work.pageEffects, effect);
    }
  }

  private rawAnswer(fieldId: string, page: PageRef): unknown {
    const answer = this.answers[fieldId];
    if (page.index === undefined) return answer;
    return isPlainObject(answer) ? answer[String(page.index)] : undefined;
  }

  /** Builder state: effects state plus the generic state built by the engine. */
  private composeState(
    progress: Progress,
    page?: PageRef,
    pageEntries?: Map<string, ResolvedEntry | ResolvedEntry[] | null>,
  ): JsonObject {
    const entries: JsonObject = {};
    for (const [fieldId, list] of Object.entries(progress.fieldEntries)) {
      const repeated = this.fieldSteps.get(fieldId)?.repeat !== undefined;
      entries[fieldId] = repeated ? list.map((item) => item.value) : (list[0]?.value ?? null);
    }
    if (page && pageEntries) {
      for (const field of page.step.fields) {
        if (page.step.repeat || pageEntries.has(field.id)) entries[field.id] = pageEntries.get(field.id) ?? null;
      }
    }
    // Effects are deep-copied; entries are copied shallowly (decorated per scope, their catalog data never mutated).
    const state: JsonObject = cloneJson(progress.effects);
    for (const counter of this.input.ruleset.counters ?? []) state[counter.id] = this.count(progress, counter.fields);
    return {
      ...state,
      entries: copyEntries(entries) as JsonObject,
      choices: copyEntries(progress.choices) as JsonObject,
      selected: copyEntries(progress.selected) as JsonObject,
      page: cloneJson(progress.pageEffects),
      spells: this.groupSpells(progress),
      labels: (buildLabels(progress.effects, this.catalog, this.locale) as JsonObject | undefined) ?? {},
    };
  }

  /** `state.spells`: chosen spells grouped by the `spellGroup` of their field (groups without spell are left out). */
  private groupSpells(progress: Progress): Record<string, unknown[]> {
    const groups: Record<string, unknown[]> = {};
    for (const picks of Object.values(progress.spellPicks)) {
      for (const { value } of picks) {
        if (value.spells.length) groups[value.group] = [...(groups[value.group] ?? []), ...value.spells];
      }
    }
    return groups;
  }

  /** Counter state: keys in order of first choice, occurrences per key. */
  private count(progress: Progress, fieldIds: string[]): JsonObject {
    const keys: string[] = [];
    const of: Record<string, number> = {};
    let total = 0;
    for (const fieldId of fieldIds) {
      for (const { value } of progress.fieldValues[fieldId] ?? []) {
        for (const key of Array.isArray(value) ? value : [value]) {
          if (typeof key !== "string") continue;
          if (of[key] === undefined) keys.push(key);
          of[key] = (of[key] ?? 0) + 1;
          total += 1;
        }
      }
    }
    return { keys, distinct: keys.length, total, of };
  }

  /** Element of a `from.path` collection: an entry key becomes the entry, an object with a `key` gets its `entry`. */
  private pathElement(element: unknown, scope: object): unknown {
    const key = typeof element === "string" ? element : isPlainObject(element) ? element.key : undefined;
    const entry = typeof key === "string" ? this.catalog.byKey.get(key) : undefined;
    if (!entry) return element;
    const exposed = this.expose(this.catalog.resolve(entry), scope);
    return typeof element === "string" ? exposed : { ...(element as JsonObject), entry: exposed };
  }

  /** `state.<collection id>`: one object per element, built from the `item` template. */
  private buildCollection(collection: RulesetCollection, scope: object, state: JsonObject): JsonObject[] {
    const selected = (state.selected ?? {}) as Record<string, JsonObject[]>;
    const source = collection.from.types
      ? collection.from.types.flatMap((type) => selected[type] ?? [])
      : getPath(state, collection.from.path ?? "");
    const list = Array.isArray(source) ? source : [];
    const items = collection.from.types ? list : list.map((element) => this.pathElement(element, scope));
    const built: { sortKey: unknown; value: JsonObject }[] = [];
    for (const item of items) {
      const itemScope = this.withRoot(scope, "item", item);
      if (collection.where !== undefined) {
        const where = evaluateExpression(collection.where, itemScope);
        if (!where.ok || !isTruthy(where.value)) continue;
      }
      const value: JsonObject = {};
      for (const [target, expression] of Object.entries(collection.item)) {
        const result = evaluateExpression(expression, itemScope);
        if (result.ok && result.value !== undefined && result.value !== null)
          setPath(value, target, cloneJson(result.value));
      }
      const sortKey = collection.sort === undefined ? undefined : evaluateExpression(collection.sort, itemScope);
      built.push({ sortKey: sortKey?.ok ? sortKey.value : undefined, value });
    }
    if (collection.sort !== undefined) {
      built.sort((a, b) => {
        if (a.sortKey === b.sortKey) return 0;
        if (a.sortKey === undefined || a.sortKey === null) return 1;
        if (b.sortKey === undefined || b.sortKey === null) return -1;
        return (a.sortKey as number | string) < (b.sortKey as number | string) ? -1 : 1;
      });
    }
    return built.map((item) => item.value);
  }

  /**
   * Data an expression reads: field values, formulas (lazy), `state`, `repeat`, `context`.
   * On its own page a field reads its current value; elsewhere a repeated field reads the array of its values.
   */
  private createScope(options: {
    state: JsonObject;
    context: BuilderContext;
    repeat?: Record<string, unknown>;
    page?: PageRef;
    pageValues?: Map<string, unknown>;
    previousValues?: Map<string, unknown>;
  }): object {
    const { state, context, repeat = {}, page, pageValues, previousValues } = options;
    const { key, version, data = {} } = this.input.ruleset;
    const scope: JsonObject = { state, repeat, context, ruleset: { key, version, data } };
    this.decorateStateEntries(state, scope);
    const building = new Set<string>();
    for (const collection of this.input.ruleset.collections ?? []) {
      let cache: JsonObject[] | undefined;
      Object.defineProperty(state, collection.id, {
        configurable: true,
        enumerable: false,
        get: () => {
          if (cache) return cache;
          if (building.has(collection.id)) return [];
          building.add(collection.id);
          cache = this.buildCollection(collection, scope, state);
          building.delete(collection.id);
          return cache;
        },
      });
    }
    const onPage = new Set(page?.step.fields.map((field) => field.id) ?? []);
    for (const fieldId of this.fieldSteps.keys()) {
      Object.defineProperty(scope, fieldId, {
        enumerable: true,
        get: () => {
          if (onPage.has(fieldId) && page) {
            if (pageValues?.has(fieldId)) return pageValues.get(fieldId);
            if (previousValues?.has(fieldId)) return previousValues.get(fieldId);
            return this.answerAsValue(fieldId, this.rawAnswer(fieldId, page));
          }
          return this.fieldValue(fieldId);
        },
      });
    }
    const memo = new Map<string, unknown>();
    const evaluating = new Set<string>();
    for (const formula of this.input.ruleset.formulas ?? []) {
      Object.defineProperty(scope, formula.id, {
        enumerable: true,
        get: () => {
          if (memo.has(formula.id)) return memo.get(formula.id);
          if (evaluating.has(formula.id)) return null;
          evaluating.add(formula.id);
          const result = evaluateExpression(formula.expression, scope);
          evaluating.delete(formula.id);
          const value = result.ok ? result.value : null;
          memo.set(formula.id, value);
          return value;
        },
      });
    }
    return scope;
  }

  /** Gives the entries of `state.entries`, `state.choices` and `state.selected` their lazy `values` and `level`. */
  private decorateStateEntries(state: JsonObject, scope: object) {
    const visit = (node: unknown) => {
      if (Array.isArray(node)) node.forEach(visit);
      else if (isPlainObject(node)) {
        if (typeof node.type === "string" && typeof node.key === "string") this.decorate(node, scope);
        else Object.values(node).forEach(visit);
      }
    };
    [state.entries, state.choices, state.selected].forEach(visit);
  }

  private fieldValue(fieldId: string): unknown {
    const repeated = this.fieldSteps.get(fieldId)?.repeat !== undefined;
    const recorded = this.progress.fieldValues[fieldId];
    if (recorded) return repeated ? recorded.map((item) => item.value) : (recorded[0]?.value ?? null);
    const answer = this.answers[fieldId];
    if (!repeated) return this.answerAsValue(fieldId, answer);
    if (!isPlainObject(answer)) return [];
    return Object.keys(answer)
      .sort((a, b) => Number(a) - Number(b))
      .map((index) => this.answerAsValue(fieldId, answer[index]));
  }

  /** Raw answer of a field not evaluated yet, in the shape of its value. */
  private answerAsValue(fieldId: string, answer: unknown): unknown {
    if (answer === undefined || answer === null) return null;
    const field = this.fieldSteps.get(fieldId)?.fields.find((candidate) => candidate.id === fieldId);
    if (field?.type !== "abilityAllocation" || !isPlainObject(answer)) return answer;
    const { method, scores } = answer as AbilityAllocationAnswer;
    return { method: method ?? null, ...(isPlainObject(scores) ? scores : {}) };
  }

  private addIssue(issue: BuilderIssue) {
    if (!this.issues.some((existing) => jsonEquals(existing, issue))) this.issues.push(issue);
  }
}

type IssueReporter = (
  fieldId: string,
  code: BuilderIssue["code"],
  severity: BuilderIssue["severity"],
  extra?: Partial<BuilderIssue>,
) => void;

type PassResult = {
  progress: Progress;
  pageValues: Map<string, unknown>;
  pageEntries: Map<string, ResolvedEntry | ResolvedEntry[] | null>;
  fields: EvaluatedField[];
  issues: BuilderIssue[];
};

/**
 * Evaluates the builder for the given answers: pages, fields, state, formulas, projected sheet and issues.
 * Never throws on ruleset data or answers.
 */
export function evaluateBuilder(input: BuilderInput): BuilderEvaluation {
  return new BuilderEngine(input).run();
}
