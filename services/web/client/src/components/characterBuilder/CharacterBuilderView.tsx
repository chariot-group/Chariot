"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { BuilderBreadcrumb } from "@/components/characterBuilder/BuilderBreadcrumb";
import { BuilderPageFields } from "@/components/characterBuilder/BuilderPageFields";
import { useCharacterBuilder, type UseCharacterBuilderOptions } from "@/hooks/useCharacterBuilder";
import { adjacentPageKey, droppedAnswerIssues, pageErrorFields } from "@/lib/characterBuilder/builderNavigation";

/**
 * Step-by-step character builder: loading/error/empty states, ruleset choice, breadcrumb, current page, navigation
 * and the hand-over to the Player creation form.
 * @see FR-ruleset-character-builder — Web builder UI
 */
export default function CharacterBuilderView(options: UseCharacterBuilderOptions & { manualFormPath: string }) {
  const t = useTranslations("characterBuilder");
  const builder = useCharacterBuilder(options);
  const { status, evaluation, currentPage, breadcrumb, blockingPages, pageChanges } = builder;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const droppedCount = evaluation ? droppedAnswerIssues(evaluation).length : 0;

  // Focus the page title when the page changes (not on the first render).
  const lastPageKey = useRef<string | null>(null);
  useEffect(() => {
    if (!currentPage) return;
    if (lastPageKey.current && lastPageKey.current !== currentPage.key) headingRef.current?.focus();
    lastPageKey.current = currentPage.key;
  }, [currentPage]);

  // Announce pages added or removed and answers dropped by the last change.
  useEffect(() => {
    const parts = [
      pageChanges.added.length && lastPageKey.current ? t("pagesAdded", { count: pageChanges.added.length }) : "",
      pageChanges.removed.length ? t("pagesRemoved", { count: pageChanges.removed.length }) : "",
    ].filter(Boolean);
    if (parts.length) setAnnouncement(parts.join(". "));
  }, [pageChanges, t]);
  useEffect(() => {
    if (droppedCount) setAnnouncement(t("answerDropped"));
  }, [droppedCount, t]);

  const shell = (children: React.ReactNode, busy = false) => (
    <main
      id="characterBuilderView"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8"
      aria-busy={busy || undefined}>
      <header className="flex min-w-0 flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
          <Wand2
            className="size-5 shrink-0 text-primary-light"
            aria-hidden="true"
          />
          {t("title")}
        </h1>
        {builder.ruleset ? (
          <p className="text-sm text-muted-foreground">
            {t("rulesetName", {
              name: builder.ruleset.name[builder.locale] ?? builder.ruleset.name.en,
            })}
          </p>
        ) : null}
      </header>
      <p
        role="status"
        aria-live="polite"
        className="sr-only">
        {announcement}
      </p>
      {children}
    </main>
  );

  if (status === "loading") {
    return shell(
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2
          className="size-4 animate-spin"
          aria-hidden="true"
        />
        {t("loading")}
      </p>,
      true,
    );
  }

  if (status === "error") {
    return shell(
      <div
        role="alert"
        className="flex flex-col items-start gap-3">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={builder.retry}>
          <RefreshCw aria-hidden="true" />
          {t("retry")}
        </Button>
      </div>,
    );
  }

  if (status === "empty") {
    return shell(
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-white">{t("empty")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        <Button
          asChild
          variant="secondary">
          <Link href={options.manualFormPath}>{t("openForm")}</Link>
        </Button>
      </div>,
    );
  }

  if (status === "choose") {
    return shell(
      <section
        aria-labelledby="builder-choose-ruleset"
        className="flex flex-col gap-3">
        <h2
          id="builder-choose-ruleset"
          className="text-lg font-semibold text-white">
          {t("chooseRuleset")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("chooseRulesetDescription")}</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {builder.rulesets.map((ruleset) => (
            <li key={ruleset._id}>
              <Button
                type="button"
                variant="secondary"
                className="h-auto w-full flex-col items-start gap-1 whitespace-normal py-3 text-left"
                onClick={() => builder.chooseRuleset(ruleset._id)}>
                <span className="font-semibold">{ruleset.name[builder.locale] ?? ruleset.name.en}</span>
                {ruleset.description ? (
                  <span className="text-xs text-muted-foreground">
                    {ruleset.description[builder.locale] ?? ruleset.description.en}
                  </span>
                ) : null}
              </Button>
            </li>
          ))}
        </ul>
      </section>,
    );
  }

  if (!evaluation || !currentPage) return shell(null, true);

  const hasNext = adjacentPageKey(evaluation.pages, currentPage.key, "next") !== null;
  const hasPrevious = adjacentPageKey(evaluation.pages, currentPage.key, "previous") !== null;
  const blockingId = "builder-blocking-pages";
  // « Next » stays disabled while the page has an error (shown on its fields); count warnings never block.
  const nextBlocked = pageErrorFields(evaluation, currentPage).length > 0;

  return shell(
    <>
      <BuilderBreadcrumb
        steps={breadcrumb}
        onSelect={builder.goTo}
      />
      <section
        aria-labelledby="builder-page-title"
        className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="builder-page-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl">
            {currentPage.title}
          </h2>
          {currentPage.description ? <p className="text-sm text-muted-foreground">{currentPage.description}</p> : null}
        </div>
        <BuilderPageFields
          page={currentPage}
          evaluation={evaluation}
          answers={builder.answers}
          onAnswersChange={builder.setAnswers}
          entryLabel={builder.entryLabel}
          onGoToPage={builder.goTo}
        />
      </section>

      {!hasNext && blockingPages.length ? (
        <section
          id={blockingId}
          aria-labelledby={`${blockingId}-title`}
          className="flex flex-col gap-2 rounded-[15px] border border-destructive/60 p-4">
          <h2
            id={`${blockingId}-title`}
            className="text-sm font-semibold text-destructive">
            {t("blockingTitle")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {blockingPages.map((page) => (
              <li key={page.key}>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0"
                  onClick={() => builder.goTo(page.key)}>
                  {page.breadcrumb}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={builder.cancel}>
          {t("cancel")}
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            disabled={!hasPrevious}
            onClick={() => builder.goToAdjacent("previous")}>
            <ArrowLeft aria-hidden="true" />
            {t("previous")}
          </Button>
          {hasNext ? (
            <Button
              type="button"
              variant="accent"
              disabled={nextBlocked}
              onClick={() => builder.goToAdjacent("next")}>
              {t("next")}
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              disabled={blockingPages.length > 0}
              aria-describedby={blockingPages.length ? blockingId : undefined}
              onClick={builder.finish}>
              {t("continue")}
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      </footer>
    </>,
  );
}
