import { expect, test, type Locator, type Page } from "@playwright/test";
import type { ChariotApi, RulesetSummary } from "@/api";
import { escapeRegExp } from "@/flows";

/**
 * Parcours de l'assistant de création de PJ (FR-ruleset-character-builder — Web builder UI), sur le seed `dnd5e-2014`.
 * Sélecteurs par rôle + nom accessible, libellés FR du seed et de `characterBuilder` (messages/fr.json).
 */

/** Ruleset joué par les scénarios : seed d'adventure, importé par `npm run ruleset:import` (pas par la stack). */
export const BUILDER_RULESET_KEY = "dnd5e-2014";

const NO_RULESET_REASON =
  `Aucun ruleset « ${BUILDER_RULESET_KEY} » publié : lancer \`npm run ruleset:import\` dans services/adventure/api`;

/** Ruleset `dnd5e-2014` publié, ou `null`. */
export async function publishedBuilderRuleset(api: ChariotApi): Promise<RulesetSummary | null> {
  const rulesets = await api.publishedRulesets().catch(() => []);
  return rulesets.find((ruleset) => ruleset.key === BUILDER_RULESET_KEY) ?? null;
}

/**
 * Ruleset `dnd5e-2014` publié ; sans lui, le test en cours est sauté, pas en échec (rien à parcourir).
 * À appeler dans un test, un `beforeEach` ou une fixture.
 */
export async function requireBuilderRuleset(api: ChariotApi): Promise<RulesetSummary> {
  const ruleset = await publishedBuilderRuleset(api);
  test.skip(!ruleset, NO_RULESET_REASON);
  return ruleset as RulesetSummary;
}

/** Titres des pages (h2) du seed, dans l'ordre du flow. */
export const PAGE = {
  race: "Choisis ta race",
  class: "Choisis ta classe",
  abilities: "Caractéristiques",
  background: "Choisis ton historique",
  equipment: "Équipement de départ",
  spells: "Sorts",
  details: "Détails du personnage",
  summary: "Récapitulatif",
} as const;

/** Libellés du fil d'Ariane d'un Guerrier niveau 1 (pas de page de sorts ni de montée de niveau). */
export const FIGHTER_BREADCRUMB = ["Race", "Classe", "Caractéristiques", "Historique", "Équipement", "Détails", "Récapitulatif"];

/** Tableau standard du Nain des collines Guerrier du seed (même réponse que le test unitaire du seed). */
const FIGHTER_SCORES: Record<string, number> = {
  Force: 15,
  Dextérité: 13,
  Constitution: 14,
  Intelligence: 8,
  Sagesse: 12,
  Charisme: 10,
};

/** Tableau standard d'un Magicien. */
const WIZARD_SCORES: Record<string, number> = {
  Force: 8,
  Dextérité: 14,
  Constitution: 13,
  Intelligence: 15,
  Sagesse: 12,
  Charisme: 10,
};

/**
 * Ouvre « Créer un personnage » depuis `trigger` puis choisit « Assistant de création », jusqu'à l'URL `builderUrl`.
 * Juste après la connexion, FR-post-auth-navigation peut encore rediriger et annuler la navigation : on relance le choix.
 */
export async function openBuilderFromDialog(page: Page, trigger: Locator, builderUrl: RegExp): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Créer un personnage" });
  await expect(async () => {
    // Déjà sur l'assistant (navigation lente, compilation de dev) : rouvrir le dialogue d'ici enregistrerait l'assistant
    // comme page d'origine et effacerait la vraie (« Annuler » y ramène).
    if (builderUrl.test(page.url())) return;
    if (!(await dialog.isVisible())) await trigger.click();
    await dialog
      .getByRole("button", { name: "Créer un personnage joueur pas à pas avec l'assistant" })
      .click({ timeout: 5_000 });
    await expect(page).toHaveURL(builderUrl, { timeout: 10_000 });
  }).toPass({ timeout: 45_000 });
  await expect(dialog).toBeHidden();
}

/** Titre (h2) de la page affichée par l'assistant. */
export function builderPageTitle(page: Page, title: string): Locator {
  return page.getByRole("heading", { level: 2, name: title, exact: true });
}

/**
 * Attend la première page de l'assistant. Avec plusieurs rulesets publiés, choisit d'abord celui du seed
 * (« Choisis les règles de création »).
 */
export async function waitForBuilderStart(page: Page): Promise<void> {
  const first = builderPageTitle(page, PAGE.race);
  const choose = page.getByRole("heading", { name: "Choisis les règles de création" });
  await expect(first.or(choose).first()).toBeVisible({ timeout: 30_000 });
  if (await choose.isVisible()) {
    await page.getByRole("button", { name: /Donjons & Dragons 5e \(2014\)/ }).click();
  }
  await expect(first).toBeVisible();
}

/** Fil d'Ariane de l'assistant (`nav` « Étapes de création »). */
export function breadcrumb(page: Page): Locator {
  return page.getByRole("navigation", { name: "Étapes de création" });
}

/**
 * Affiche la liste des étapes : sous 768 px, elle est repliée derrière « Étape n sur N ». Renvoie le fil d'Ariane.
 */
export async function showBreadcrumbSteps(page: Page): Promise<Locator> {
  const nav = breadcrumb(page);
  const toggle = nav.getByRole("button", { name: /^Étape \d+ sur \d+/ });
  if ((await toggle.isVisible()) && (await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
  return nav;
}

/** Étape du fil d'Ariane, par son libellé (nom accessible « 2. Classe (terminée) »). */
export function breadcrumbStep(nav: Locator, label: string): Locator {
  return nav.getByRole("button", { name: new RegExp(`^\\d+\\. ${escapeRegExp(label)} \\(`) });
}

/** Libellés des étapes du fil d'Ariane, dans l'ordre (liste affichée au préalable sur mobile). */
export async function breadcrumbLabels(page: Page): Promise<string[]> {
  const nav = await showBreadcrumbSteps(page);
  const names = await nav.getByRole("listitem").getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => button.textContent ?? ""),
  );
  // Texte = « 1. Race(en cours) » (numéro et état en sr-only) : on garde le libellé seul.
  return names.map((name) => name.replace(/^\d+\.\s*/, "").replace(/\((en cours|terminée|à corriger|à venir)\)$/, "").trim());
}

/**
 * Carte (région) d'un champ ou d'un choix accordé, par son titre. Un champ requis est suivi de « (obligatoire) »,
 * annoncé aux technologies d'assistance uniquement.
 */
export function builderCard(page: Page, title: string): Locator {
  return page.getByRole("region", { name: new RegExp(`^${escapeRegExp(title)}( \\(obligatoire\\))?$`) });
}

/** Bouton « Suivant » du pied de page. */
export function nextButton(page: Page): Locator {
  return page.getByRole("button", { name: "Suivant", exact: true });
}

/** Passe à la page suivante et attend son titre (qui reçoit le focus, FR-ruleset-character-builder — Accessibility). */
export async function goNext(page: Page, title: string): Promise<void> {
  await nextButton(page).click();
  await expect(builderPageTitle(page, title)).toBeVisible();
}

/**
 * Coche une option (carte radio ou case à cocher) d'un groupe. La carte entière est cliquable (label étiré) : on clique
 * le libellé, puis on vérifie l'état du contrôle. Sans effet si l'option est déjà cochée.
 */
export async function chooseOption(scope: Locator, label: string): Promise<void> {
  const control = scope
    .getByRole("radio", { name: label, exact: true })
    .or(scope.getByRole("checkbox", { name: label, exact: true }));
  if (await control.isChecked()) return;
  await scope.getByText(label, { exact: true }).click();
  await expect(control).toBeChecked();
}

/** Remplit les valeurs de base au tableau standard (une liste par caractéristique : « Base de Force »…). */
export async function allocateStandardArray(page: Page, scores: Record<string, number>): Promise<void> {
  const card = builderCard(page, "Valeurs de base");
  await chooseOption(card.getByRole("radiogroup", { name: "Méthode" }), "Tableau standard");
  for (const [ability, score] of Object.entries(scores)) {
    await card.getByLabel(`Base de ${ability}`, { exact: true }).selectOption(String(score));
  }
}

/** Page « Race » : race puis, s'il y a lieu, sous-race (choix accordé « Sous-race »). */
export async function chooseRace(page: Page, race: string, subrace?: string): Promise<void> {
  await chooseOption(builderCard(page, "Race"), race);
  if (subrace) await chooseOption(builderCard(page, "Sous-race"), subrace);
}

/** Page « Classe » : classe dans la carte « Classe et niveau » (niveau 1 par défaut). */
export async function chooseClass(page: Page, className: string): Promise<void> {
  await chooseOption(builderCard(page, "Classe"), className);
}

/** Pages « Historique » à « Détails » : historique, équipement suggéré, prénom ; alignement laissé par défaut. */
async function finishCommonPages(page: Page, options: { background: string; firstname: string; spells?: boolean }) {
  await chooseOption(builderCard(page, "Historique"), options.background);
  await goNext(page, PAGE.equipment);
  await goNext(page, options.spells ? PAGE.spells : PAGE.details);
  if (options.spells) return;
  await fillBuilderFirstname(page, options.firstname);
  await goNext(page, PAGE.summary);
}

/** Prénom de la page « Détails » (champ requis : « Prénom (obligatoire) » pour les technologies d'assistance). */
export async function fillBuilderFirstname(page: Page, firstname: string): Promise<void> {
  await builderCard(page, "Identité").getByLabel(/^Prénom/).fill(firstname);
}

/**
 * Nain des collines Guerrier niveau 1, de la page « Race » jusqu'au récapitulatif (aucune erreur bloquante).
 * Attendu à la fin : race Nain / Nain des collines, Constitution 16, 14 PV (10 + 3 + 1, ténacité naine).
 */
export async function buildHillDwarfFighter(page: Page, firstname: string): Promise<void> {
  await chooseRace(page, "Nain", "Nain des collines");
  await goNext(page, PAGE.class);
  await chooseClass(page, "Guerrier");
  await goNext(page, PAGE.abilities);
  await allocateStandardArray(page, FIGHTER_SCORES);
  await goNext(page, PAGE.background);
  await finishCommonPages(page, { background: "Soldat", firstname });
}

/** Nain des collines Magicien niveau 1, de la page « Race » jusqu'à la page « Sorts ». */
export async function buildHillDwarfWizardUntilSpells(page: Page): Promise<void> {
  await chooseRace(page, "Nain", "Nain des collines");
  await goNext(page, PAGE.class);
  await chooseClass(page, "Magicien");
  await goNext(page, PAGE.abilities);
  await allocateStandardArray(page, WIZARD_SCORES);
  await goNext(page, PAGE.background);
  await finishCommonPages(page, { background: "Sage", firstname: "", spells: true });
}

/** « Continuer vers la fiche » sur le récapitulatif : ouvre le formulaire PJ prérempli (`?fromBuilder=1`). */
export async function continueToPlayerForm(page: Page, formUrl: RegExp): Promise<void> {
  await page.getByRole("button", { name: "Continuer vers la fiche", exact: true }).click();
  await expect(page).toHaveURL(formUrl);
  await expect(page.getByLabel("Prénom", { exact: true })).toBeVisible();
}

/** Enregistre le formulaire PJ ouvert par l'assistant et renvoie l'identifiant du PJ créé (lu dans l'URL de sa fiche). */
export async function submitPlayerForm(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(page.getByText("Personnage créé avec succès")).toBeVisible();
  await expect(page).toHaveURL(/\/characters\/[a-f0-9]{24}(?:[?#].*)?$/);
  return new URL(page.url()).pathname.split("/characters/")[1].split("/")[0];
}

/** Compteur « n / attendu » d'une carte, par son nom accessible (« 3 choix sur 3 suggérés »). */
export function counter(card: Locator, count: number, expected: number): Locator {
  return card.getByLabel(`${count} choix sur ${expected} suggérés`, { exact: true });
}

/** Intercepte la santé et la recherche du Codex (`…/spells`) : la librairie communautaire paraît indisponible. */
export async function simulateCodexDown(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname.endsWith("/spells"),
    (route) => route.abort("connectionrefused"),
  );
}
