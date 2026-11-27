"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setPlayerCodexDraft } from "@/store/slices/codexDraftSlice";
import rulesetService, { type RulesetDetail, type RulesetSummary } from "@/services/RulesetService";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import {
  RULESET_DEFAULT_LOCALE,
  RULESET_LOCALES,
  type BuilderAnswers,
  type BuilderEvaluation,
  type RulesetEntry,
  type RulesetLocale,
} from "@/lib/rulesetEngine/types";
import {
  adjacentPageKey,
  buildBreadcrumb,
  diffPageKeys,
  incompletePages,
  resolveCurrentPageKey,
} from "@/lib/characterBuilder/builderNavigation";
import { clearBuilderProgress, loadBuilderProgress, saveBuilderProgress } from "@/lib/characterBuilder/builderProgress";
import { buildPlayerDraftFromSheet } from "@/lib/characterBuilder/builderDraft";

/**
 * State of the step-by-step character builder: ruleset loading, answers, engine evaluation, navigation,
 * session persistence and the hand-over to the Player creation form.
 *
 * @see FR-ruleset-character-builder — Web builder UI
 */

export const BUILDER_GAME_SYSTEM = "DND_5E";

export type CharacterBuilderStatus = "loading" | "error" | "empty" | "choose" | "ready";

type Loaded = { ruleset: RulesetDetail; entries: RulesetEntry[] };

export type UseCharacterBuilderOptions = {
  /** Session storage scope (one builder per route). */
  scope: string;
  /** Campaign group of the created character; empty groups in Player space. */
  groupId?: string | null;
  /** Player creation form opened at the end (`?fromBuilder=1`). */
  formPath: string;
  /** Destination of « Cancel ». */
  cancelPath: string;
};

const toRulesetLocale = (locale: string): RulesetLocale =>
  (RULESET_LOCALES as readonly string[]).includes(locale) ? (locale as RulesetLocale) : RULESET_DEFAULT_LOCALE;

const sessionStore = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

export function useCharacterBuilder({ scope, groupId, formPath, cancelPath }: UseCharacterBuilderOptions) {
  const locale = toRulesetLocale(useLocale());
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<CharacterBuilderStatus>("loading");
  const [rulesets, setRulesets] = useState<RulesetSummary[]>([]);
  const [rulesetId, setRulesetId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [answers, setAnswers] = useState<BuilderAnswers>({});
  const [wantedPageKey, setWantedPageKey] = useState<string | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const restored = useRef(false);

  // Rulesets of the game system; a saved progress or a single ruleset starts directly.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    rulesetService
      .listRulesets(BUILDER_GAME_SYSTEM)
      .then((list) => {
        if (cancelled) return;
        setRulesets(list);
        if (!list.length) return setStatus("empty");
        const saved = restored.current ? null : loadBuilderProgress(sessionStore(), scope);
        restored.current = true;
        if (saved && list.some((ruleset) => ruleset._id === saved.rulesetId)) {
          setAnswers(saved.answers);
          setWantedPageKey(saved.pageKey);
          setVisited(saved.visited);
          setRulesetId(saved.rulesetId);
        } else if (list.length === 1) {
          setRulesetId(list[0]._id);
        } else {
          setStatus("choose");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [scope, reloadToken]);

  // Ruleset and its whole catalog, loaded once per selected ruleset.
  useEffect(() => {
    if (!rulesetId) return;
    let cancelled = false;
    setStatus("loading");
    Promise.all([rulesetService.getRuleset(rulesetId), rulesetService.getCatalog(rulesetId)])
      .then(([ruleset, entries]) => {
        if (cancelled) return;
        setLoaded({ ruleset, entries });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [rulesetId, reloadToken]);

  const evaluation: BuilderEvaluation | null = useMemo(
    () =>
      loaded
        ? evaluateBuilder({
            ruleset: loaded.ruleset,
            entries: loaded.entries,
            answers,
            context: { mode: "creation", locale },
          })
        : null,
    [loaded, answers, locale],
  );

  const pageKeys = useMemo(() => evaluation?.pages.map((page) => page.key) ?? [], [evaluation]);
  const previousPageKeys = useRef<string[]>([]);
  const currentKey = useMemo(
    () => (evaluation ? resolveCurrentPageKey(evaluation.pages, wantedPageKey, previousPageKeys.current) : null),
    [evaluation, wantedPageKey],
  );
  const pageChanges = useMemo(() => diffPageKeys(previousPageKeys.current, pageKeys), [pageKeys]);
  useEffect(() => {
    previousPageKeys.current = pageKeys;
  }, [pageKeys]);

  // The current page is visited; progress is saved on every change.
  useEffect(() => {
    if (currentKey && !visited.includes(currentKey)) setVisited((keys) => [...keys, currentKey]);
  }, [currentKey, visited]);
  useEffect(() => {
    if (status !== "ready" || !rulesetId) return;
    saveBuilderProgress(sessionStore(), scope, { rulesetId, answers, pageKey: currentKey, visited });
  }, [status, rulesetId, answers, currentKey, visited, scope]);

  const entryLabel = useMemo(() => {
    const labels = new Map<string, string>();
    for (const entry of loaded?.entries ?? []) {
      if (!labels.has(entry.key)) labels.set(entry.key, entry.label[locale] ?? entry.label.en);
    }
    return (key: string) => labels.get(key) ?? key;
  }, [loaded, locale]);

  const breadcrumb = useMemo(
    () => (evaluation && currentKey ? buildBreadcrumb(evaluation, currentKey, visited) : []),
    [evaluation, currentKey, visited],
  );
  const currentPage = evaluation?.pages.find((page) => page.key === currentKey) ?? null;
  const blockingPages = useMemo(() => (evaluation ? incompletePages(evaluation) : []), [evaluation]);

  const goTo = useCallback(
    (key: string) => {
      if (key === currentKey || visited.includes(key)) setWantedPageKey(key);
    },
    [currentKey, visited],
  );
  const goToAdjacent = useCallback(
    (direction: "previous" | "next") => {
      if (!evaluation || !currentKey) return;
      const key = adjacentPageKey(evaluation.pages, currentKey, direction);
      if (key) setWantedPageKey(key);
    },
    [evaluation, currentKey],
  );

  const finish = useCallback(() => {
    if (!evaluation || blockingPages.length) return;
    dispatch(setPlayerCodexDraft(buildPlayerDraftFromSheet(evaluation.sheet, groupId)));
    clearBuilderProgress(sessionStore(), scope);
    router.push(formPath);
  }, [evaluation, blockingPages, dispatch, groupId, scope, router, formPath]);

  const cancel = useCallback(() => {
    clearBuilderProgress(sessionStore(), scope);
    router.push(cancelPath);
  }, [scope, router, cancelPath]);

  const chooseRuleset = useCallback((id: string) => {
    setAnswers({});
    setVisited([]);
    setWantedPageKey(null);
    setRulesetId(id);
  }, []);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return {
    status,
    locale,
    rulesets,
    ruleset: loaded?.ruleset ?? null,
    evaluation,
    answers,
    setAnswers,
    currentPage,
    breadcrumb,
    blockingPages,
    pageChanges,
    entryLabel,
    goTo,
    goToAdjacent,
    finish,
    cancel,
    chooseRuleset,
    retry,
  };
}
