import type { ChariotApi, CreatedCampaign } from "@/api";
import { E2E_PREFIX, uniqueLabel } from "@/env";
import {
  campaignButton,
  closeSpaceMenu,
  deleteCampaignWithGroups,
  ensureSidebarOpen,
  gmSpaceButton,
  openCampaignActions,
  openCampaignSidebar,
  openSpaceMenu,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * Gestion des campagnes depuis le menu « Espace maître du jeu » de la sidebar.
 * Couvre FR-sidebar-context-actions (Modifier / Supprimer une campagne, confirmation Échap / Entrée,
 * clic droit sur ordinateur et bouton `⋮` sous 1024 px, navigation après suppression d'une campagne),
 * FR-form-field-validation § Group and campaign names (1 à 50 caractères), FR-post-auth-navigation et
 * FR-welcome-onboarding-fallbacks (destination après suppression).
 * La création depuis l'accueil est couverte par `creation-campagne.spec.ts`.
 */

type Fixtures = {
  /** Crée une campagne par l'API ; toutes celles créées pendant le test sont supprimées à la fin. */
  seedCampaign: (name: string) => Promise<CreatedCampaign>;
};

const test = base.extend<Fixtures>({
  seedCampaign: async ({ gm }, use) => {
    const created: CreatedCampaign[] = [];
    await use(async (name) => {
      const campaign = await gm.api.createCampaign(uniqueLabel(name));
      created.push(campaign);
      return campaign;
    });
    // Déjà supprimées par le test pour certaines : la suppression est alors sans effet ou refusée.
    for (const campaign of created) await deleteCampaignWithGroups(gm.api, campaign._id).catch(() => undefined);
  },
});

async function campaignLabels(api: ChariotApi): Promise<string[]> {
  return (await api.listCampaigns()).map((c) => c.label);
}

test.describe("Gestion des campagnes", () => {
  test("le MJ crée une campagne depuis le menu de l'espace MJ", async ({ gm, seedCampaign }) => {
    const current = await seedCampaign("Courante");
    const label = uniqueLabel("Nouvelle");
    const nav = await openCampaignSidebar(gm.page, current);

    try {
      await test.step("« Créer une campagne » ouvre le dialogue de création", async () => {
        const menu = await openSpaceMenu(gm.page);
        await menu.getByRole("menuitem", { name: "Créer une campagne" }).click();
      });

      await test.step("enregistrer : la nouvelle campagne devient la campagne de l'espace MJ", async () => {
        const dialog = gm.page.getByRole("dialog", { name: "Créer une nouvelle campagne" });
        await dialog.getByLabel("Nom de la campagne").fill(label);
        await dialog.getByRole("button", { name: "Sauvegarder" }).click();
        await expect(gm.page.getByText(`Campagne ${label} créée avec succès !`)).toBeVisible();
        await expect(dialog).toBeHidden();
        await closeSpaceMenu(gm.page);
        await ensureSidebarOpen(gm.page);
        await expect(gmSpaceButton(gm.page)).toHaveAttribute("aria-pressed", "true");
        await expect(nav.getByRole("heading", { name: label })).toBeVisible();
      });

      await test.step("la campagne existe côté API et dans le menu", async () => {
        await expect.poll(() => campaignLabels(gm.api)).toContain(label);
        const menu = await openSpaceMenu(gm.page);
        await expect(campaignButton(menu, label)).toBeVisible();
      });
    } finally {
      for (const campaign of (await gm.api.listCampaigns()).filter((c) => c.label === label)) {
        await deleteCampaignWithGroups(gm.api, campaign._id);
      }
    }
  });

  test("le nom de la campagne est requis et limité à 50 caractères", async ({ gm, seedCampaign }) => {
    const current = await seedCampaign("Courante");
    await openCampaignSidebar(gm.page, current);
    const before = await campaignLabels(gm.api);

    const menu = await openSpaceMenu(gm.page);
    await menu.getByRole("menuitem", { name: "Créer une campagne" }).click();
    const dialog = gm.page.getByRole("dialog", { name: "Créer une nouvelle campagne" });
    const field = dialog.getByLabel("Nom de la campagne");
    const save = dialog.getByRole("button", { name: "Sauvegarder" });

    await test.step("nom vide ou blanc : Sauvegarder désactivé", async () => {
      await field.fill("   ");
      await expect(save).toBeDisabled();
    });

    await test.step("exactement 50 caractères : accepté", async () => {
      await field.fill("x".repeat(50));
      await expect(field).not.toHaveAttribute("aria-invalid", "true");
      await expect(save).toBeEnabled();
    });

    await test.step("51 caractères : message sur le champ, aria-invalid, Sauvegarder désactivé, rien n'est tronqué", async () => {
      await field.fill("x".repeat(51));
      await expect(dialog.getByText("Le nom ne doit pas dépasser 50 caractères")).toBeVisible();
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveValue("x".repeat(51));
      await expect(save).toBeDisabled();
    });

    await test.step("Annuler ne crée aucune campagne", async () => {
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();
      expect((await campaignLabels(gm.api)).sort()).toEqual(before.sort());
    });
  });

  test("le MJ renomme la campagne affichée", async ({ gm, seedCampaign }) => {
    const current = await seedCampaign("Avant");
    const renamed = uniqueLabel("Après");
    const nav = await openCampaignSidebar(gm.page, current);

    await test.step("Modifier ouvre le dialogue prérempli", async () => {
      const menu = await openSpaceMenu(gm.page);
      const actions = await openCampaignActions(gm.page, menu, current.label);
      await actions.getByRole("menuitem", { name: "Modifier" }).click();
    });

    const dialog = gm.page.getByRole("dialog", { name: "Modifier la campagne" });
    await test.step("enregistrer le nouveau nom", async () => {
      const field = dialog.getByLabel("Nom de la campagne");
      await expect(field).toHaveValue(current.label);
      await field.fill(renamed);
      await dialog.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(gm.page.getByText(`Campagne ${renamed} mise à jour avec succès !`)).toBeVisible();
      await expect(dialog).toBeHidden();
      await closeSpaceMenu(gm.page);
    });

    await test.step("le nouveau nom remplace l'ancien dans la sidebar, le menu et l'API", async () => {
      await ensureSidebarOpen(gm.page);
      await expect(nav.getByRole("heading", { name: renamed })).toBeVisible();
      const menu = await openSpaceMenu(gm.page);
      await expect(campaignButton(menu, renamed)).toBeVisible();
      await expect(campaignButton(menu, current.label)).toHaveCount(0);
      await expect.poll(() => campaignLabels(gm.api)).toContain(renamed);
      expect(await campaignLabels(gm.api)).not.toContain(current.label);
    });
  });

  test("supprimer une autre campagne demande confirmation et garde la vue courante", async ({ gm, seedCampaign }) => {
    const current = await seedCampaign("Affichée");
    const other = await seedCampaign("Autre");
    const nav = await openCampaignSidebar(gm.page, current);
    const confirm = gm.page.getByRole("dialog", { name: "Supprimer la campagne" });

    await test.step("Échap annule : la campagne est conservée", async () => {
      const menu = await openSpaceMenu(gm.page);
      const actions = await openCampaignActions(gm.page, menu, other.label);
      await actions.getByRole("menuitem", { name: "Supprimer" }).click();
      await expect(confirm.getByText("Cette action est irréversible.", { exact: false })).toBeVisible();
      await gm.page.keyboard.press("Escape");
      await expect(confirm).toBeHidden();
      expect(await campaignLabels(gm.api)).toContain(other.label);
    });

    await test.step("Supprimer confirme : la campagne disparaît du menu et de l'API", async () => {
      await closeSpaceMenu(gm.page);
      await ensureSidebarOpen(gm.page);
      const menu = await openSpaceMenu(gm.page);
      const actions = await openCampaignActions(gm.page, menu, other.label);
      await actions.getByRole("menuitem", { name: "Supprimer" }).click();
      await confirm.getByRole("button", { name: "Supprimer" }).click();
      await expect(confirm).toBeHidden();
      await expect(campaignButton(menu, other.label)).toHaveCount(0);
      await expect.poll(() => campaignLabels(gm.api)).not.toContain(other.label);
    });

    await test.step("la campagne affichée reste ouverte", async () => {
      await closeSpaceMenu(gm.page);
      await expect(gm.page).toHaveURL(new RegExp(`/campaigns/${current._id}`));
      await ensureSidebarOpen(gm.page);
      await expect(nav.getByRole("heading", { name: current.label })).toBeVisible();
    });
  });

  test("supprimer la campagne affichée quitte son adresse", async ({ gm, seedCampaign }) => {
    const current = await seedCampaign("Affichée");
    const other = await seedCampaign("Restante");
    await openCampaignSidebar(gm.page, current);

    await test.step("supprimer la campagne affichée, confirmer avec Entrée", async () => {
      const menu = await openSpaceMenu(gm.page);
      const actions = await openCampaignActions(gm.page, menu, current.label);
      await actions.getByRole("menuitem", { name: "Supprimer" }).click();
      const confirm = gm.page.getByRole("dialog", { name: "Supprimer la campagne" });
      await expect(confirm).toBeVisible();
      await gm.page.keyboard.press("Enter");
      await expect(confirm).toBeHidden();
    });

    await test.step("l'application quitte la campagne supprimée, qui n'est plus proposée", async () => {
      await expect(gm.page).not.toHaveURL(new RegExp(`/campaigns/${current._id}`));
      await expect.poll(() => campaignLabels(gm.api)).not.toContain(current.label);
      await closeSpaceMenu(gm.page);
      await ensureSidebarOpen(gm.page);
      const menu = await openSpaceMenu(gm.page);
      await expect(campaignButton(menu, other.label)).toBeVisible();
      await expect(campaignButton(menu, current.label)).toHaveCount(0);
    });
  });

  test("supprimer sa dernière campagne ramène dans l'espace joueur", async ({ gm, seedCampaign }) => {
    await test.step("préparer un compte MJ avec une seule campagne", async () => {
      // Restes de scénarios interrompus sur le compte de test de ce worker (un seul test à la fois par compte).
      for (const leftover of (await gm.api.listCampaigns()).filter((c) => c.label.startsWith(E2E_PREFIX))) {
        await deleteCampaignWithGroups(gm.api, leftover._id);
      }
      const others = await gm.api.listCampaigns();
      test.skip(others.length > 0, `le compte MJ a d'autres campagnes que celles des scénarios (${others.length})`);
    });

    const last = await seedCampaign("Dernière");
    await openCampaignSidebar(gm.page, last);

    await test.step("supprimer la dernière campagne", async () => {
      const menu = await openSpaceMenu(gm.page);
      const actions = await openCampaignActions(gm.page, menu, last.label);
      await actions.getByRole("menuitem", { name: "Supprimer" }).click();
      await gm.page.getByRole("dialog", { name: "Supprimer la campagne" }).getByRole("button", { name: "Supprimer" }).click();
    });

    await test.step("l'espace joueur est affiché, avec le message de changement d'espace", async () => {
      await expect(gm.page.getByText("Vous êtes maintenant dans l'espace joueur.")).toBeVisible();
      await expect(gm.page).not.toHaveURL(new RegExp(`/campaigns/${last._id}`));
      await closeSpaceMenu(gm.page);
      await ensureSidebarOpen(gm.page);
      await expect(gm.page.getByRole("button", { name: "Espace joueur" })).toHaveAttribute("aria-pressed", "true");
      await expect(gmSpaceButton(gm.page)).toHaveAttribute("aria-pressed", "false");
      await expect(gm.page.getByRole("navigation", { name: "Navigation joueur" })).toBeVisible();
      expect(await gm.api.listCampaigns()).toHaveLength(0);
    });
  });
});
