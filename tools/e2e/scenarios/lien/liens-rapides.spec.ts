import type { Page } from "@playwright/test";
import type { ChariotApi, CreatedCampaign, QuickLink } from "@/api";
import { E2E_PREFIX, uniqueLabel } from "@/env";
import {
  deleteQuickLinksByPrefix,
  expandQuickLinks,
  openCampaignSidebar,
  openPlayerSpace,
  openQuickLinkActions,
  ownQuickLinks,
  quickLink,
  sharedQuickLinks,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * CRUD des liens rapides de la sidebar (espace joueur et espace MJ), liens communs compris.
 * Couvre FR-sidebar-quick-links (ajout, modification, suppression, validation titre / URL, visibilité multi-espaces,
 * séparateur « Liens communs », ouverture dans un nouvel onglet, refus 400 / 403 de l'API, toast d'erreur)
 * et FR-sidebar-context-actions (clic droit sur ordinateur, bouton `⋮` sous 1024 px).
 *
 * Les liens sont propres à chaque compte et chaque worker a sa paire de comptes : les liens `[e2e]` du MJ
 * et du joueur sont supprimés à la fin de chaque test, même en échec.
 */

async function expectQuickLinkInApi(api: ChariotApi, label: string, expected: Partial<QuickLink> = {}) {
  await expect
    .poll(async () => (await api.listQuickLinks()).find((l) => l.label === label), {
      message: `lien ${label} côté API`,
    })
    .toMatchObject({ label, ...expected });
}

async function expectQuickLinkNotInApi(api: ChariotApi, label: string) {
  await expect
    .poll(async () => (await api.listQuickLinks()).map((l) => l.label), { message: `lien ${label} absent côté API` })
    .not.toContain(label);
}

/** Ouvre le dialogue « Ajouter un lien rapide » de l'espace affiché. */
async function openAddDialog(page: Page) {
  await expandQuickLinks(page);
  await page.getByRole("button", { name: "Ajouter un lien rapide" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un lien rapide" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Campagne propre au test, créée par l'API et supprimée à la fin (même en échec). */
async function withCampaign(api: ChariotApi, label: string, run: (campaign: CreatedCampaign) => Promise<void>) {
  const campaign = await api.createCampaign(uniqueLabel(label));
  try {
    await run(campaign);
  } finally {
    await api.deleteCampaign(campaign._id).catch(() => undefined);
  }
}

const test = base.extend<{ cleanup: void }>({
  cleanup: [
    async ({ gm, player }, use) => {
      await use();
      await deleteQuickLinksByPrefix(gm.api, E2E_PREFIX);
      await deleteQuickLinksByPrefix(player.api, E2E_PREFIX);
    },
    { auto: true },
  ],
});

test.describe("Liens rapides", () => {
  test("le joueur ajoute un lien depuis l'espace joueur", async ({ player }) => {
    const label = uniqueLabel("Règles");
    const url = "https://example.com/regles";
    await openPlayerSpace(player.page);
    const dialog = await openAddDialog(player.page);

    await test.step("le dialogue ne propose que « toutes mes campagnes » et l'icône se choisit au clavier", async () => {
      await expect(dialog.getByLabel("Accessible depuis toutes mes campagnes")).not.toBeChecked();
      await expect(dialog.getByLabel("Accessible depuis l'espace joueur")).toHaveCount(0);
      const icons = dialog.getByRole("radiogroup", { name: "Icône" });
      await expect(icons.getByRole("radio", { name: "Lien" })).toHaveAttribute("aria-checked", "true");
      await icons.getByRole("radio", { name: "Livre" }).focus();
      await player.page.keyboard.press("Enter");
      await expect(icons.getByRole("radio", { name: "Livre" })).toHaveAttribute("aria-checked", "true");
      await expect(icons.getByRole("radio", { name: "Lien" })).toHaveAttribute("aria-checked", "false");
    });

    await test.step("remplir et sauvegarder", async () => {
      await dialog.getByLabel("Titre").fill(label);
      await dialog.getByLabel("URL").fill(url);
      await dialog.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("le lien est listé dans l'espace joueur et s'ouvre dans un nouvel onglet", async () => {
      const link = quickLink(ownQuickLinks(player.page, "player"), label);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", url);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await expect(sharedQuickLinks(player.page)).toHaveCount(0);
      await expectQuickLinkInApi(player.api, label, { url, icon: "BookOpen", campaignId: null });
    });
  });

  test("le MJ ajoute un lien propre à une campagne", async ({ gm }) => {
    const label = uniqueLabel("Carte");
    await withCampaign(gm.api, "Campagne liens", async (campaign) => {
      await openCampaignSidebar(gm.page, campaign);
      const dialog = await openAddDialog(gm.page);

      await test.step("les deux options de visibilité sont proposées, décochées", async () => {
        await expect(dialog.getByLabel("Accessible depuis toutes mes campagnes")).not.toBeChecked();
        await expect(dialog.getByLabel("Accessible depuis l'espace joueur")).not.toBeChecked();
      });

      await test.step("valider avec Entrée", async () => {
        await dialog.getByLabel("Titre").fill(label);
        await dialog.getByLabel("URL").fill("https://example.com/carte");
        await dialog.getByLabel("URL").press("Enter");
        await expect(dialog).toBeHidden();
      });

      await test.step("le lien est listé sous la campagne, rattaché à elle côté API", async () => {
        await expect(quickLink(ownQuickLinks(gm.page, "campaign"), label)).toBeVisible();
        await expectQuickLinkInApi(gm.api, label, {
          campaignId: campaign._id,
          visibleInAllCampaigns: false,
          visibleInPlayerSpace: false,
        });
      });

      await test.step("il n'apparaît pas dans l'espace joueur", async () => {
        await openPlayerSpace(gm.page);
        await expandQuickLinks(gm.page);
        await expect(quickLink(gm.page, label)).toHaveCount(0);
        expect((await gm.api.listQuickLinks(null)).map((l) => l.label)).not.toContain(label);
      });
    });
  });

  test("le titre et une URL http(s) sont requis", async ({ player }) => {
    await openPlayerSpace(player.page);
    const dialog = await openAddDialog(player.page);
    const title = dialog.getByLabel("Titre");
    const url = dialog.getByLabel("URL");
    const save = dialog.getByRole("button", { name: "Sauvegarder" });

    await test.step("l'URL attendue est expliquée sous le champ", async () => {
      await expect(url).toHaveAccessibleDescription("L'URL doit commencer par http:// ou https://");
    });

    await test.step("titre vide ou blanc : Sauvegarder désactivé", async () => {
      await url.fill("https://example.com");
      await title.fill("   ");
      await expect(save).toBeDisabled();
    });

    await test.step("URL sans protocole : Sauvegarder désactivé", async () => {
      await title.fill(uniqueLabel("Sans protocole"));
      await url.fill("example.com");
      await expect(save).toBeDisabled();
      await url.fill("ftp://example.com");
      await expect(save).toBeDisabled();
    });

    await test.step("titre limité à 60 caractères à la saisie", async () => {
      await url.fill("http://example.com");
      await title.fill("x".repeat(61));
      await expect(title).toHaveValue("x".repeat(60));
      await expect(save).toBeEnabled();
    });

    await test.step("Annuler ne crée aucun lien", async () => {
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();
      expect((await player.api.listQuickLinks()).filter((l) => l.label.startsWith(E2E_PREFIX))).toHaveLength(0);
    });
  });

  test("le joueur modifie un lien", async ({ player }) => {
    const label = uniqueLabel("Avant");
    const renamed = uniqueLabel("Après");
    const newUrl = "https://example.com/apres";
    await player.api.createQuickLink({ label, url: "https://example.com/avant", icon: "Link" });
    await openPlayerSpace(player.page);
    await expandQuickLinks(player.page);
    await expect(quickLink(player.page, label)).toBeVisible();

    const dialog = player.page.getByRole("dialog", { name: "Modifier le lien rapide" });
    await test.step("Modifier ouvre le dialogue prérempli", async () => {
      const menu = await openQuickLinkActions(player.page, label);
      await menu.getByRole("menuitem", { name: "Modifier" }).click();
      await expect(dialog.getByLabel("Titre")).toHaveValue(label);
      await expect(dialog.getByLabel("URL")).toHaveValue("https://example.com/avant");
      await expect(dialog.getByRole("radio", { name: "Lien" })).toHaveAttribute("aria-checked", "true");
    });

    await test.step("enregistrer titre, URL et icône", async () => {
      await dialog.getByLabel("Titre").fill(renamed);
      await dialog.getByLabel("URL").fill(newUrl);
      await dialog.getByRole("radio", { name: "Carte" }).click();
      await dialog.getByRole("button", { name: "Modifier" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("la sidebar et l'API reflètent la modification, sans copie", async () => {
      const link = quickLink(player.page, renamed);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", newUrl);
      await expect(quickLink(player.page, label)).toHaveCount(0);
      await expectQuickLinkInApi(player.api, renamed, { url: newUrl, icon: "Map" });
      await expectQuickLinkNotInApi(player.api, label);
    });
  });

  test("le joueur supprime un lien après confirmation", async ({ player }) => {
    const label = uniqueLabel("Supprimable");
    await player.api.createQuickLink({ label, url: "https://example.com/supprimable" });
    await openPlayerSpace(player.page);
    await expandQuickLinks(player.page);
    const confirm = player.page.getByRole("dialog", { name: "Supprimer le lien" });

    await test.step("Échap annule : le lien est conservé", async () => {
      const menu = await openQuickLinkActions(player.page, label);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      await expect(
        confirm.getByText("Êtes-vous sûr de vouloir supprimer ce lien ? Cette action est irréversible."),
      ).toBeVisible();
      await player.page.keyboard.press("Escape");
      await expect(confirm).toBeHidden();
      await expect(quickLink(player.page, label)).toBeVisible();
      await expectQuickLinkInApi(player.api, label);
    });

    await test.step("Supprimer confirme : le lien disparaît de la sidebar et de l'API", async () => {
      const menu = await openQuickLinkActions(player.page, label);
      await menu.getByRole("menuitem", { name: "Supprimer" }).click();
      await confirm.getByRole("button", { name: "Supprimer" }).click();
      await expect(confirm).toBeHidden();
      await expect(quickLink(player.page, label)).toHaveCount(0);
      await expectQuickLinkNotInApi(player.api, label);
    });
  });

  test("un lien commun est visible dans chaque espace où il est partagé", async ({ gm }) => {
    const own = uniqueLabel("Propre A");
    const allCampaigns = uniqueLabel("Toutes campagnes");
    const playerSpaceOnly = uniqueLabel("Espace joueur");

    await withCampaign(gm.api, "Campagne A", async (campaignA) => {
      await withCampaign(gm.api, "Campagne B", async (campaignB) => {
        await gm.api.createQuickLink({ label: own, url: "https://example.com/a", campaignId: campaignA._id });
        await gm.api.createQuickLink({
          label: playerSpaceOnly,
          url: "https://example.com/joueur",
          campaignId: campaignA._id,
          visibleInPlayerSpace: true,
        });
        await openCampaignSidebar(gm.page, campaignA);

        await test.step("créer dans A un lien « Accessible depuis toutes mes campagnes »", async () => {
          const dialog = await openAddDialog(gm.page);
          await dialog.getByLabel("Titre").fill(allCampaigns);
          await dialog.getByLabel("URL").fill("https://example.com/toutes");
          await dialog.getByLabel("Accessible depuis toutes mes campagnes").check();
          await dialog.getByRole("button", { name: "Sauvegarder" }).click();
          await expect(dialog).toBeHidden();
          await expectQuickLinkInApi(gm.api, allCampaigns, { campaignId: campaignA._id, visibleInAllCampaigns: true });
        });

        await test.step("sous A : liens propres en haut, séparateur, puis liens communs", async () => {
          await expect(quickLink(ownQuickLinks(gm.page, "campaign"), own)).toBeVisible();
          const shared = sharedQuickLinks(gm.page);
          await expect(quickLink(shared, allCampaigns)).toBeVisible();
          await expect(quickLink(shared, playerSpaceOnly)).toBeVisible();
          await expect(gm.page.getByTitle("Partagés avec d'autres espaces")).toHaveText("Liens communs");
        });

        await test.step("sous B : seul le lien « toutes mes campagnes », sans séparateur", async () => {
          await openCampaignSidebar(gm.page, campaignB);
          await expandQuickLinks(gm.page);
          await expect(quickLink(sharedQuickLinks(gm.page), allCampaigns)).toBeVisible();
          await expect(quickLink(gm.page, playerSpaceOnly)).toHaveCount(0);
          await expect(quickLink(gm.page, own)).toHaveCount(0);
          await expect(ownQuickLinks(gm.page, "campaign")).toHaveCount(0);
          await expect(gm.page.getByTitle("Partagés avec d'autres espaces")).toHaveCount(0);
        });

        await test.step("dans l'espace joueur : seul le lien « espace joueur »", async () => {
          await openPlayerSpace(gm.page);
          await expandQuickLinks(gm.page);
          await expect(quickLink(sharedQuickLinks(gm.page), playerSpaceOnly)).toBeVisible();
          await expect(quickLink(gm.page, allCampaigns)).toHaveCount(0);
          await expect(quickLink(gm.page, own)).toHaveCount(0);
        });

        await test.step("supprimer le lien commun depuis B prévient qu'il disparaît partout", async () => {
          await openCampaignSidebar(gm.page, campaignB);
          await expandQuickLinks(gm.page);
          const menu = await openQuickLinkActions(gm.page, allCampaigns);
          await menu.getByRole("menuitem", { name: "Supprimer" }).click();
          const confirm = gm.page.getByRole("dialog", { name: "Supprimer le lien" });
          await expect(
            confirm.getByText("Ce lien est partagé : il disparaîtra de tous les espaces où il est visible.", {
              exact: false,
            }),
          ).toBeVisible();
          await confirm.getByRole("button", { name: "Supprimer" }).click();
          await expect(confirm).toBeHidden();
          await expect(quickLink(gm.page, allCampaigns)).toHaveCount(0);
          await expectQuickLinkNotInApi(gm.api, allCampaigns);
        });
      });
    });
  });

  test("en cas d'erreur réseau à l'ajout, un toast s'affiche et le dialogue reste ouvert", async ({ player }) => {
    const label = uniqueLabel("Hors ligne");
    await openPlayerSpace(player.page);
    await player.page.route("**/quick-links", (route) =>
      route.request().method() === "POST" ? route.abort("failed") : route.fallback(),
    );
    const dialog = await openAddDialog(player.page);

    await dialog.getByLabel("Titre").fill(label);
    await dialog.getByLabel("URL").fill("https://example.com/hors-ligne");
    await dialog.getByRole("button", { name: "Sauvegarder" }).click();

    await expect(player.page.getByText("Échec de l'ajout du lien.")).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Titre")).toHaveValue(label);
    await expect(dialog.getByRole("button", { name: "Sauvegarder" })).toBeEnabled();
    expect((await player.api.listQuickLinks()).map((l) => l.label)).not.toContain(label);
  });

  test("l'API refuse les liens invalides et les liens d'un autre utilisateur", async ({ gm, player }) => {
    const label = uniqueLabel("Lien du MJ");
    const link = await gm.api.createQuickLink({ label, url: "https://example.com/mj" });

    await test.step("400 : URL sans protocole, titre vide, titre trop long, visibilité non booléenne", async () => {
      const valid = { icon: "Link", url: "https://example.com", label: uniqueLabel("Invalide"), campaignId: null };
      expect(await player.api.quickLinkStatus("POST", "", { ...valid, url: "example.com" })).toBe(400);
      expect(await player.api.quickLinkStatus("POST", "", { ...valid, label: "" })).toBe(400);
      expect(await player.api.quickLinkStatus("POST", "", { ...valid, label: "x".repeat(61) })).toBe(400);
      expect(await player.api.quickLinkStatus("POST", "", { ...valid, visibleInAllCampaigns: "oui" })).toBe(400);
    });

    await test.step("dans l'espace joueur, « espace joueur » est ignoré (stocké à false)", async () => {
      const playerLabel = uniqueLabel("Joueur forcé");
      await player.api.createQuickLink({
        label: playerLabel,
        url: "https://example.com/j",
        visibleInPlayerSpace: true,
      });
      await expectQuickLinkInApi(player.api, playerLabel, { campaignId: null, visibleInPlayerSpace: false });
    });

    await test.step("403 : un joueur ne modifie ni ne supprime le lien du MJ", async () => {
      expect(await player.api.quickLinkStatus("PATCH", `/${link._id}`, { label: "piraté" })).toBe(403);
      expect(await player.api.quickLinkStatus("DELETE", `/${link._id}`)).toBe(403);
      expect((await player.api.listQuickLinks()).map((l) => l._id)).not.toContain(link._id);
      await expectQuickLinkInApi(gm.api, label);
    });
  });
});
