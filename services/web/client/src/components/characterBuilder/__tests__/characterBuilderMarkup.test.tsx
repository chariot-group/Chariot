import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

// The Codex search dialog (closed here) and its health check need the Codex service; markup only is tested.
vi.mock("@/components/character/tabContents/magic/CodexSpellSearchDialog", () => ({ default: () => null }));
const codexHealth = vi.hoisted(() => ({ isAvailable: true, isChecking: false }));
vi.mock("@/hooks/useCodexHealth", () => ({ useCodexHealth: () => codexHealth }));
import messages from "@/../messages/fr.json";
import { BuilderBreadcrumb } from "@/components/characterBuilder/BuilderBreadcrumb";
import { BuilderPageFields } from "@/components/characterBuilder/BuilderPageFields";
import { buildBreadcrumb } from "@/lib/characterBuilder/builderNavigation";
import { evaluateBuilder } from "@/lib/rulesetEngine/engine";
import type { BuilderAnswers } from "@/lib/rulesetEngine/types";
import { fixtureEntries, fixtureRuleset } from "@/lib/__tests__/rulesetEngineFixture";

/**
 * Accessible markup of the builder (breadcrumb, field groups, errors).
 * @see FR-ruleset-character-builder — Web builder UI (Accessibility)
 */

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="fr"
      messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );

const evaluate = (answers: BuilderAnswers) =>
  evaluateBuilder({
    ruleset: fixtureRuleset,
    entries: fixtureEntries,
    answers,
    context: { mode: "creation", locale: "fr" },
  });

const renderPage = (answers: BuilderAnswers, key: string) => {
  const evaluation = evaluate(answers);
  const page = evaluation.pages.find((candidate) => candidate.key === key)!;
  return render(
    <BuilderPageFields
      page={page}
      evaluation={evaluation}
      answers={answers}
      onAnswersChange={() => undefined}
      entryLabel={(entryKey) => entryKey}
      onGoToPage={() => undefined}
    />,
  );
};

describe("character builder markup — FR-ruleset-character-builder (Accessibility)", () => {
  it("nominal: the breadcrumb is a nav with an ordered list and the current step", () => {
    const evaluation = evaluate({ race: "dwarf", targetLevel: 2 });
    const html = render(
      <BuilderBreadcrumb
        steps={buildBreadcrumb(evaluation, "class", ["race", "class"])}
        onSelect={() => undefined}
      />,
    );

    expect(html).toContain('<nav aria-label="Étapes de création"');
    expect(html).toContain("<ol");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Étape 2 sur 5");
    expect(html).toContain("(en cours)");
    expect(html).toContain("(à venir)");
    // Pages not reached yet cannot be skipped to.
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });

  it("nominal: each field and each grant is a card with an accent heading labelling its radio group", () => {
    const html = renderPage({ race: "dwarf", raceChoices: { "dwarf-subrace": ["hill-dwarf"] } }, "race");

    expect(html).toContain('<section aria-labelledby="builder-race-race-title"');
    expect(html).toContain('<h3 id="builder-race-race-title" class="text-lg font-semibold text-primary-light">');
    expect(html).toContain('role="radiogroup" aria-labelledby="builder-race-race-title"');
    expect(html).toContain('type="radio"');
    expect(html).toContain("via Nain des collines");
    expect(html).toContain('aria-label="0 choix sur 1 suggérés"');
    // The whole option card is the click target (stretched label).
    expect(html).toContain("after:absolute after:inset-0");
    // No visual asterisk, the requirement is for screen readers.
    expect(html).not.toContain(">*<");
  });

  it("edge: the ability allocation offers the methods, and the computed value shows its suggestion", () => {
    const html = renderPage(
      { abilityScores: { method: "standardArray", scores: { strength: 15 } }, strengthTotal: 16 },
      "abilities",
    );

    expect(html).toContain("Tableau standard");
    expect(html).toContain("Place chacune de ces valeurs une seule fois : 15, 14, 13.");
    expect(html).toContain('aria-label="Base de strength"');
    expect(html).toContain("Suggestion : 15");
    // The reset is a link under the field, not a button next to it.
    expect(html).toContain(">Revenir à la suggestion</button>");
  });

  it("failure: a missing required choice is an error linked to its field, with an icon and a text", () => {
    const html = renderPage({}, "race");

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="builder-race-race-messages"');
    expect(html).toContain('id="builder-race-race-messages"');
    expect(html).toContain("Ce choix est obligatoire.");
    expect(html).toMatch(/<span class="sr-only"> \((<!-- -->)?obligatoire(<!-- -->)?\)<\/span>/);
    expect(html).toContain("text-destructive");
  });
});

describe("character builder spells markup — FR-ruleset-character-builder (Spells, lot B)", () => {
  const spellRuleset = {
    key: "spells",
    version: 1,
    flow: {
      steps: [
        {
          id: "spells",
          order: 1,
          title: { en: "Spells" },
          breadcrumb: { en: "Spells" },
          modes: ["creation" as const],
          fields: [
            {
              id: "cantrips",
              type: "spellSelect" as const,
              label: { en: "Cantrips", fr: "Sorts mineurs" },
              count: 2,
              spellFilter: { className: "wizard", minLevel: 0, maxLevel: 0 },
            },
          ],
        },
      ],
    },
  };
  const renderSpells = (answers: BuilderAnswers) => {
    const evaluation = evaluateBuilder({
      ruleset: spellRuleset,
      entries: [{ type: "class", key: "wizard", label: { en: "Wizard", fr: "Magicien" } }],
      answers,
      context: { mode: "creation", locale: "fr" },
    });
    return render(
      <BuilderPageFields
        page={evaluation.pages[0]}
        evaluation={evaluation}
        answers={answers}
        onAnswersChange={() => undefined}
        entryLabel={(key) => (key === "wizard" ? "Magicien" : key)}
        onGoToPage={() => undefined}
      />,
    );
  };

  it("nominal: chosen spells are listed with their source, level and counter", () => {
    const html = renderSpells({ cantrips: [{ source: "codex", name: "Fire Bolt", level: 0 }] });

    // The add buttons come before the list of chosen spells.
    expect(html.indexOf("Ajouter à la main")).toBeLessThan(html.indexOf("Fire Bolt"));
    expect(html).toContain("Sorts mineurs");
    expect(html).toContain('aria-label="1 choix sur 2 suggérés"');
    expect(html).toContain("Magicien · Sort mineur");
    expect(html).toContain("Fire Bolt");
    expect(html).toContain("Codex");
    expect(html).toContain('aria-label="Retirer Fire Bolt"');
    expect(html).toContain("Chercher dans le Codex");
    expect(html).toContain("Ajouter à la main");
  });

  it("edge: a manual spell can be edited, a spell outside the levels is flagged", () => {
    const html = renderSpells({ cantrips: [{ source: "manual", name: "Shield", level: 1 }] });

    expect(html).toContain('aria-label="Modifier Shield"');
    expect(html).toContain("Manuel");
    expect(html).toContain("Ce sort sort des niveaux proposés pour ce choix.");
  });

  it("failure: Codex down keeps the search focusable but unavailable, explained by a tooltip, manual first", () => {
    codexHealth.isAvailable = false;
    const html = renderSpells({});
    codexHealth.isAvailable = true;

    expect(html).toMatch(/<button[^>]*aria-disabled="true"[^>]*aria-describedby="[^"]*-codex-unavailable"/);
    // The explanation is the accessible description (and tooltip), not a visible text below.
    expect(html).toMatch(/<span id="[^"]*-codex-unavailable" class="sr-only">La librairie communautaire/);
    // Same order as with the Codex: search first, then manual entry (the main action).
    expect(html.indexOf("Chercher dans le Codex")).toBeLessThan(html.indexOf("Ajouter à la main"));
  });

  it("failure: without spell the field says so and warns about the count", () => {
    const html = renderSpells({});

    expect(html).toContain("Aucun sort choisi.");
    expect(html).toContain("Encore 2 à choisir (2 suggérés).");
  });
});

describe("character builder point buy — costs shown (FR-ruleset-character-builder)", () => {
  it("nominal: each point-buy value shows its cost, and the help lists every cost", () => {
    const html = renderPage({ abilityScores: { method: "pointBuy", scores: { strength: 13 } } }, "abilities");

    expect(html).toContain("13 (5 pts)");
    expect(html).toContain("8 (gratuit)");
    expect(html).toContain("Coût de chaque valeur : 8 = 0, 13 = 5, 14 = 7, 15 = 9.");
  });
});

describe("character builder ability table — FR-ruleset-character-builder (Fields: abilityAllocation)", () => {
  it("edge: config.totals shows base, bonus and total on one row and hides the separate total field", () => {
    const ruleset = {
      ...fixtureRuleset,
      flow: {
        steps: fixtureRuleset.flow.steps.map((step) =>
          step.id !== "abilities"
            ? step
            : {
                ...step,
                fields: step.fields.map((field) =>
                  field.type === "abilityAllocation"
                    ? { ...field, config: { ...field.config, totals: { strength: "strengthTotal" } } }
                    : field,
                ),
              },
        ),
      },
    };
    const answers = { race: "elf", abilityScores: { method: "standardArray", scores: { strength: 15 } } };
    const evaluation = evaluateBuilder({
      ruleset,
      entries: fixtureEntries,
      answers,
      context: { mode: "creation", locale: "fr" },
    });
    const html = render(
      <BuilderPageFields
        page={evaluation.pages.find((candidate) => candidate.key === "abilities")!}
        evaluation={evaluation}
        answers={answers}
        onAnswersChange={() => undefined}
        entryLabel={(key) => key}
        onGoToPage={() => undefined}
      />,
    );

    expect(html).toContain('<th scope="col"');
    expect(html).toMatch(/<th scope="row"[^>]*>strength<\/th>.*?\+1<\/td>.*?>16<\/td>/);
    expect(html).not.toContain('for="builder-abilities-strengthTotal"');
  });
});

describe("character builder cards and summary — FR-ruleset-character-builder (Layout, summary)", () => {
  const cardRuleset = {
    ...fixtureRuleset,
    flow: {
      steps: fixtureRuleset.flow.steps.map((step) =>
        step.id === "class"
          ? {
              ...step,
              cards: [
                {
                  id: "classAndLevel",
                  title: { en: "Class and level", fr: "Classe et niveau" },
                  fields: ["class", "targetLevel"],
                },
              ],
            }
          : step,
      ),
    },
  };
  const cardEntries = fixtureEntries.map((entry) =>
    entry.key === "fighter"
      ? {
          ...entry,
          grants: entry.grants?.map((grant) => ({
            ...grant,
            label: { en: "Skills", fr: "Compétences" },
            description: { en: "Proficient skills.", fr: "Tu maîtrises ces compétences." },
          })),
        }
      : entry,
  );
  const renderKey = (answers: BuilderAnswers, key: string) => {
    const evaluation = evaluateBuilder({
      ruleset: cardRuleset,
      entries: cardEntries,
      answers,
      context: { mode: "creation", locale: "fr" },
    });
    return render(
      <BuilderPageFields
        page={evaluation.pages.find((candidate) => candidate.key === key)!}
        evaluation={evaluation}
        answers={answers}
        onAnswersChange={() => undefined}
        entryLabel={(entryKey) => entryKey}
        onGoToPage={() => undefined}
      />,
    );
  };

  it("nominal: a step card groups its fields under its title, each field keeping its own label", () => {
    const html = renderKey({ class: "fighter" }, "class");

    expect(html).toMatch(
      /<h3 id="[^"]*-card-classAndLevel" class="text-lg font-semibold text-primary-light">Classe et niveau<\/h3>/,
    );
    expect(html).toMatch(/<h4 id="builder-class-class-title"[^>]*>Classe/);
    expect(html).toContain('<label for="builder-class-targetLevel" class="text-sm font-medium text-white">Level');
  });

  it("edge: a grant shows its label, owner, number to choose, description and the count numbers", () => {
    const html = renderKey({ class: "fighter", classChoices: { "fighter-skills": ["athletics"] } }, "class");

    expect(html).toContain(">Compétences</h3>");
    expect(html).toContain("via Guerrier · choisis 2");
    expect(html).toContain("Tu maîtrises ces compétences.");
    expect(html).toContain("Encore 1 à choisir (2 suggérés).");
  });

  it("nominal: the summary has one card per page with a Modify button, then the sheet card", () => {
    const html = renderKey({ race: "dwarf", class: "fighter" }, "summary");

    expect(html).toContain(">Peuple</h3>");
    expect(html).toContain('aria-label="Modifier : Peuple"');
    expect(html).toContain('aria-label="Modifier : Classe"');
    expect(html).toContain("<dd");
    expect(html).toContain(">Statistiques du personnage</h3>");
    // Half width like the page cards (no full-width span).
    expect(html).not.toContain("lg:col-span-2");
    expect(html).not.toContain('aria-label="Modifier : Summary"');
  });
});
