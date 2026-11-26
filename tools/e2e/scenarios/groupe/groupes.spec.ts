import type { Locator } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, CreatedGroup, GroupSection } from "@/api";
import { uniqueLabel } from "@/env";
import {
  archivesSection,
  deleteCampaignWithGroups,
  expandArchives,
  groupHeader,
  openArchivesActions,
  openCampaignSidebar,
  openGroupActions,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * CRUD des groupes de campagne dans la sidebar MJ, archives comprises.
 * Couvre FR-sidebar-context-actions (Modifier, Archiver / Restaurer, Supprimer, « Supprimer tous les groupes
 * archivés », confirmations Échap / Entrée, clic droit sur ordinateur et bouton `⋮` sous 1024 px),
 * FR-form-field-validation § Group and campaign names (1 à 50 caractères) et FR-sidebar-navigation (« Vos archives »).
 *
 * Chaque test crée sa propre campagne par l'API (aucun groupe partagé entre workers) et la supprime à la fin.
 */

/**
 * Crée un groupe par l'API et attend qu'il soit rattaché à la campagne : adventure ajoute l'identifiant
 * à `campaign.groups.active` après avoir répondu au POST.
 */
async function seedGroup(api: ChariotApi, campaignId: string, label: string): Promise<CreatedGroup> {
  const group = await api.createGroup(campaignId, label);
  await expectGroupIn(api, campaignId, "active", label);
  return group;
}

async function groupLabels(api: ChariotApi, campaignId: string, section: GroupSection): Promise<string[]> {
  return (await api.listGroups(campaignId, section)).map((g) => g.label);
}

async function expectGroupIn(api: ChariotApi, campaignId: string, section: GroupSection, label: string) {
  await expect.poll(() => groupLabels(api, campaignId, section), { message: `${label} en ${section}` }).toContain(label);
}

async function expectGroupNotIn(api: ChariotApi, campaignId: string, section: GroupSection, label: string) {
  await expect
    .poll(() => groupLabels(api, campaignId, section), { message: `${label} hors ${section}` })
    .not.toContain(label);
}

/** Le groupe n'est affiché qu'une fois dans la sidebar, et dans la section attendue. */
async function expectGroupInSidebar(nav: Locator, label: string, section: GroupSection) {
  const archives = await archivesSection(nav);
  await expect(groupHeader(nav, label)).toHaveCount(1);
  await expect(groupHeader(archives, label)).toHaveCount(section === "archived" ? 1 : 0);
}

/** Campagne propre au test, créée par l'API et supprimée avec ses groupes à la fin (même en échec). */
const test = base.extend<{ campaign: CreatedCampaign }>({
  campaign: async ({ gm }, use) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne groupes"));
    await use(campaign);
    await deleteCampaignWithGroups(gm.api, campaign._id);
  },
});

test.describe("Groupes de campagne", () => {

  test("le MJ crée un groupe depuis la sidebar", async ({ gm, campaign }) => {
    const label = uniqueLabel("Groupe");
    const nav = await openCampaignSidebar(gm.page, campaign);

    await test.step("remplir et valider « Créer un nouveau groupe »", async () => {
      await nav.getByRole("button", { name: "Créer un groupe" }).click();
      const dialog = gm.page.getByRole("dialog", { name: "Créer un nouveau groupe" });
      await dialog.getByLabel("Nom du groupe").fill(label);
      await dialog.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(gm.page.getByText(`Groupe ${label} créé avec succès !`)).toBeVisible();
      await expect(dialog).toBeHidden();
    });

    await test.step("le groupe est actif dans la sidebar et côté API", async () => {
      await expectGroupInSidebar(nav, label, "active");
      await expectGroupIn(gm.api, campaign._id, "active", label);
    });
  });

  test("le nom du groupe est requis et limité à 50 caractères", async ({ gm, campaign }) => {
    const nav = await openCampaignSidebar(gm.page, campaign);
    await nav.getByRole("button", { name: "Créer un groupe" }).click();
    const dialog = gm.page.getByRole("dialog", { name: "Créer un nouveau groupe" });
    const field = dialog.getByLabel("Nom du groupe");
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

    await test.step("Annuler ne crée aucun groupe", async () => {
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();
      expect(await gm.api.listGroups(campaign._id, "active")).toHaveLength(0);
    });
  });

  test("le MJ renomme un groupe", async ({ gm, campaign }) => {
    const label = uniqueLabel("Avant");
    const renamed = uniqueLabel("Après");
    await seedGroup(gm.api, campaign._id, label);
    const nav = await openCampaignSidebar(gm.page, campaign);

    await test.step("Modifier ouvre le dialogue prérempli", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await expect(menu.getByText(label, { exact: true }), "nom complet en tête du menu").toBeVisible();
      await menu.getByRole("menuitem", { name: "Modifier" }).click();
    });

    const dialog = gm.page.getByRole("dialog", { name: "Modifier le groupe" });
    await test.step("enregistrer le nouveau nom", async () => {
      const field = dialog.getByLabel("Nom du groupe");
      await expect(field).toHaveValue(label);
      await field.fill(renamed);
      await dialog.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(gm.page.getByText(`Groupe ${renamed} mis à jour avec succès !`)).toBeVisible();
      await expect(dialog).toBeHidden();
    });

    await test.step("le nouveau nom remplace l'ancien dans la sidebar et côté API", async () => {
      await expect(groupHeader(nav, renamed)).toBeVisible();
      await expect(groupHeader(nav, label)).toHaveCount(0);
      await expectGroupIn(gm.api, campaign._id, "active", renamed);
      await expectGroupNotIn(gm.api, campaign._id, "active", label);
    });
  });

  test("le MJ archive puis restaure un groupe", async ({ gm, campaign }) => {
    const label = uniqueLabel("Archivable");
    await seedGroup(gm.api, campaign._id, label);
    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandArchives(nav);
    await expect((await archivesSection(nav)).getByText("Aucune archive.")).toBeVisible();

    await test.step("Archiver : le groupe passe dans « Vos archives »", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await expect(menu.getByRole("menuitem", { name: "Restaurer" })).toHaveCount(0);
      await menu.getByRole("menuitem", { name: "Archiver" }).click();
      await expect(gm.page.getByText("Groupe archivé avec succès.")).toBeVisible();
      await expectGroupInSidebar(nav, label, "archived");
      await expectGroupIn(gm.api, campaign._id, "archived", label);
      await expectGroupNotIn(gm.api, campaign._id, "active", label);
    });

    await test.step("un groupe archivé ne propose ni Archiver ni Dupliquer", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await expect(menu.getByRole("menuitem", { name: "Archiver" })).toHaveCount(0);
      await expect(menu.getByRole("menuitem", { name: "Dupliquer" })).toHaveCount(0);
      await expect(menu.getByRole("menuitem", { name: "Repos long du groupe" })).toHaveCount(0);
      await gm.page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    });

    await test.step("Restaurer : le groupe revient dans les groupes actifs", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await menu.getByRole("menuitem", { name: "Restaurer" }).click();
      await expect(gm.page.getByText("Groupe restauré avec succès.")).toBeVisible();
      await expectGroupInSidebar(nav, label, "active");
      await expect((await archivesSection(nav)).getByText("Aucune archive.")).toBeVisible();
      await expectGroupIn(gm.api, campaign._id, "active", label);
      await expectGroupNotIn(gm.api, campaign._id, "archived", label);
    });
  });

  test("le MJ supprime un groupe après confirmation", async ({ gm, campaign }) => {
    const label = uniqueLabel("Supprimable");
    await seedGroup(gm.api, campaign._id, label);
    const nav = await openCampaignSidebar(gm.page, campaign);
    const confirm = gm.page.getByRole("dialog", { name: "Supprimer le groupe" });

    await test.step("Échap annule : le groupe est conservé", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      await expect(confirm).toBeVisible();
      await expect(confirm.getByText("Cette action est irréversible.", { exact: false })).toBeVisible();
      await gm.page.keyboard.press("Escape");
      await expect(confirm).toBeHidden();
      await expect(groupHeader(nav, label)).toBeVisible();
      await expectGroupIn(gm.api, campaign._id, "active", label);
    });

    await test.step("Supprimer confirme : le groupe disparaît de la sidebar et de l'API", async () => {
      const menu = await openGroupActions(gm.page, nav, label);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      await confirm.getByRole("button", { name: "Supprimer" }).click();
      await expect(gm.page.getByText("Groupe supprimé avec succès.")).toBeVisible();
      await expect(confirm).toBeHidden();
      await expect(groupHeader(nav, label)).toHaveCount(0);
      await expectGroupNotIn(gm.api, campaign._id, "active", label);
    });
  });

  test("le MJ supprime tous les groupes archivés sans toucher aux groupes actifs", async ({ gm, campaign }) => {
    const kept = uniqueLabel("Actif");
    const archivedA = uniqueLabel("Archive A");
    const archivedB = uniqueLabel("Archive B");
    await seedGroup(gm.api, campaign._id, kept);
    const toArchive = [await seedGroup(gm.api, campaign._id, archivedA), await seedGroup(gm.api, campaign._id, archivedB)];
    await gm.api.archiveGroups(
      campaign._id,
      toArchive.map((g) => g._id),
    );
    await expectGroupIn(gm.api, campaign._id, "archived", archivedB);

    const nav = await openCampaignSidebar(gm.page, campaign);
    await expandArchives(nav);
    const archives = await archivesSection(nav);
    await expect(groupHeader(archives, archivedA)).toBeVisible();
    await expect(groupHeader(archives, archivedB)).toBeVisible();

    await test.step("le menu des archives annonce le nombre de groupes à supprimer", async () => {
      const menu = await openArchivesActions(gm.page, nav);
      await menu.getByRole("menuitem", { name: "Supprimer tous les groupes archivés" }).click();
    });

    const confirm = gm.page.getByRole("dialog", { name: "Supprimer tous les groupes archivés" });
    await test.step("confirmer avec Entrée", async () => {
      await expect(confirm.getByText("Êtes-vous sûr de vouloir supprimer les 2 groupes archivés ?")).toBeVisible();
      await gm.page.keyboard.press("Enter");
      await expect(gm.page.getByText("Tous les groupes archivés ont été supprimés.")).toBeVisible();
      await expect(confirm).toBeHidden();
    });

    await test.step("les archives sont vides, le groupe actif est conservé", async () => {
      await expect(archives.getByText("Aucune archive.")).toBeVisible();
      await expectGroupInSidebar(nav, kept, "active");
      await expect.poll(() => groupLabels(gm.api, campaign._id, "archived")).toHaveLength(0);
      await expectGroupIn(gm.api, campaign._id, "active", kept);
    });

    await test.step("sans archive, la section n'offre plus d'action de suppression", async () => {
      // Sous 1024 px, plus de bouton `⋮` ; sur ordinateur, le clic droit n'ouvre plus de menu.
      await expect(nav.getByRole("button", { name: "Actions sur les archives" })).toHaveCount(0);
      await nav.getByRole("button", { name: "Vos archives" }).click({ button: "right" });
      await expect(gm.page.getByRole("menu", { name: "Actions sur les archives" })).toHaveCount(0);
    });
  });
});
