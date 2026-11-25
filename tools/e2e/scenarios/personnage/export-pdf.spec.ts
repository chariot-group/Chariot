import type { Download, Page, TestInfo } from "@playwright/test";
import type { ChariotApi, CreatedCharacter, NpcSeed, PlayerSeed, SpellcastingSeed } from "@/api";
import { E2E_PREFIX, env, uniqueLabel } from "@/env";
import {
  characterLink,
  deleteCampaignWithGroups,
  deleteCharacters,
  expandGroup,
  gotoSettled,
  groupContent,
  openCampaignSidebar,
  openCharacterActions,
  openPlayerSpace,
  seedActiveGroup,
} from "@/flows";
import { expect, test as base } from "@/fixtures";

/**
 * Export PDF des fiches PJ, depuis la fiche et depuis le menu d'actions de la sidebar (espace joueur et groupe MJ).
 * Couvre FR-character-sheet-pdf-export (dialogue de thème Sombre / Clair, téléchargement côté client, nom de fichier
 * `chariot-{prénom}-{nom}-{AAAA-MM-JJ}.pdf` assaini, 2 pages sans magie / 3 pages avec, textes longs, PNJ « bientôt
 * disponible » désactivé, toast d'erreur) et FR-sidebar-context-actions (clic droit sur ordinateur, `⋮` sous 1024 px).
 *
 * Le PDF est généré dans le navigateur : on intercepte le téléchargement et on vérifie l'en-tête `%PDF-` et le nombre
 * de pages (objets `/Type /Page`, non compressés). Le contenu textuel (flux compressés) relève des tests unitaires.
 * Chaque test prépare ses personnages par l'API et les supprime à la fin, même en échec.
 */

const WIZARD: SpellcastingSeed = {
  className: "Wizard",
  ability: "INT",
  saveDC: 13,
  attackBonus: 5,
  spellSlotsByLevel: { "1": { total: 2, used: 0 } },
  totalSlots: 2,
  spells: [],
};

/** Date du nom de fichier, au format du client web (`toISOString`, UTC). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Nombre de pages d'un PDF : objets `/Type /Page` (hors `/Pages`, l'arbre des pages). */
function pdfPageCount(pdf: Buffer): number {
  return pdf.toString("latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0;
}

/** Contenu d'un téléchargement, vérifié comme PDF non vide. */
async function readPdf(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const pdf = Buffer.concat(chunks);
  expect(pdf.subarray(0, 5).toString("latin1"), "en-tête PDF").toBe("%PDF-");
  return pdf;
}

/** Dialogue « Exporter la fiche en PDF » ouvert, avec son bouton d'export et ses thèmes. */
function exportDialog(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Exporter la fiche en PDF" });
  return {
    dialog,
    dark: dialog.getByRole("button", { name: /^Sombre/ }),
    light: dialog.getByRole("button", { name: /^Clair/ }),
    exportButton: dialog.getByRole("button", { name: "Exporter la fiche en PDF" }),
  };
}

/** Lance l'export depuis le dialogue ouvert et renvoie le téléchargement, après le toast de succès. */
async function exportFromDialog(page: Page): Promise<Download> {
  const { dialog, exportButton } = exportDialog(page);
  const downloadPromise = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloadPromise;
  await expect(page.getByText("Fiche exportée en PDF.")).toBeVisible();
  await expect(dialog).toBeHidden();
  return download;
}

/** Ouvre la fiche d'un personnage (`/{locale}/characters/{id}`) en lecture. */
async function openSheet(page: Page, id: string): Promise<void> {
  await gotoSettled(page, `/${env.locale}/characters/${id}`, new RegExp(`/characters/${id}`));
}

/** Les infobulles de survol ne s'ouvrent pas sur les projets tactiles. */
function canHover(testInfo: TestInfo): boolean {
  return testInfo.project.name.startsWith("desktop-");
}

/** Compte les téléchargements d'une page, pour vérifier qu'aucun fichier n'est produit. */
function countDownloads(page: Page): { readonly count: number } {
  const counter = { count: 0 };
  page.on("download", () => counter.count++);
  return counter;
}

type Seeded = {
  player: (api: ChariotApi, name: string, seed?: PlayerSeed) => Promise<CreatedCharacter>;
  npc: (api: ChariotApi, name: string, seed?: NpcSeed) => Promise<CreatedCharacter>;
};

/** Personnages préparés par l'API pendant le test, supprimés à la fin (même en échec) avec le compte qui les a créés. */
const test = base.extend<{ seeded: Seeded }>({
  seeded: async ({}, use) => {
    const created = new Map<ChariotApi, string[]>();
    const track = (api: ChariotApi, character: CreatedCharacter) => {
      created.set(api, [...(created.get(api) ?? []), character._id]);
      return character;
    };
    await use({
      player: async (api, name, seed) => track(api, await api.createPlayer(name, seed)),
      npc: async (api, name, seed) => track(api, await api.createNpc(name, seed)),
    });
    for (const [api, ids] of created) await deleteCharacters(api, ids);
  },
});

test.describe("Export PDF des fiches PJ", () => {
  test("le joueur exporte la fiche d'un PJ sans magie depuis sa fiche (thème sombre)", async ({ player, seeded }) => {
    const suffix = Date.now().toString(36);
    const firstname = `${E2E_PREFIX} Éowyn l'Ancienne ${suffix}`;
    const character = await seeded.player(player.api, firstname, { lastname: "De Rohan" });
    await openSheet(player.page, character._id);
    const { dialog, dark, light } = exportDialog(player.page);

    await test.step("« Exporter en PDF » ouvre le choix du thème, Sombre par défaut", async () => {
      await player.page.getByRole("button", { name: "Exporter la fiche en PDF" }).click();
      await expect(dialog.getByText(`Télécharger la fiche de ${firstname} De Rohan au format PDF.`)).toBeVisible();
      await expect(dark).toHaveAttribute("aria-pressed", "true");
      await expect(light).toHaveAttribute("aria-pressed", "false");
      await light.click();
      await expect(light).toHaveAttribute("aria-pressed", "true");
      await dark.click();
      await expect(dark).toHaveAttribute("aria-pressed", "true");
      await expect(light).toHaveAttribute("aria-pressed", "false");
    });

    const download = await test.step("Exporter télécharge le PDF et confirme par un toast", () =>
      exportFromDialog(player.page));

    await test.step("nom de fichier assaini et PDF de 2 pages (pas de page de sorts)", async () => {
      expect(download.suggestedFilename()).toBe(`chariot-e2e-owyn-l-Ancienne-${suffix}-De-Rohan-${today()}.pdf`);
      expect(pdfPageCount(await readPdf(download))).toBe(2);
    });
  });

  test("le joueur exporte un PJ lanceur de sorts depuis « Vos personnages » (thème clair)", async ({
    player,
    seeded,
  }) => {
    const name = uniqueLabel("Magicienne");
    await seeded.player(player.api, name, { spellcasting: [WIZARD] });
    const nav = await openPlayerSpace(player.page);
    await expect(characterLink(nav, name)).toBeVisible();

    await test.step("le menu d'actions du PJ propose « Exporter en PDF »", async () => {
      const menu = await openCharacterActions(player.page, nav, name);
      await menu.getByRole("menuitem", { name: "Exporter en PDF" }).click();
    });

    await test.step("choisir Clair puis exporter : PDF de 3 pages", async () => {
      const { light } = exportDialog(player.page);
      await light.click();
      await expect(light).toHaveAttribute("aria-pressed", "true");
      const download = await exportFromDialog(player.page);
      expect(download.suggestedFilename()).toMatch(new RegExp(`^chariot-e2e-Magicienne-[a-z0-9]+-${today()}\\.pdf$`));
      expect(pdfPageCount(await readPdf(download))).toBe(3);
    });
  });

  test("le MJ exporte un PJ depuis un groupe de campagne", async ({ gm, seeded }) => {
    const campaign = await gm.api.createCampaign(uniqueLabel("Campagne PDF"));
    try {
      const group = await seedActiveGroup(gm.api, campaign._id, uniqueLabel("Groupe PDF"));
      const name = uniqueLabel("PJ du groupe");
      await seeded.player(gm.api, name, { groups: [group._id] });
      const nav = await openCampaignSidebar(gm.page, campaign);
      await expandGroup(nav, group.label);
      const content = await groupContent(nav, group.label);
      await expect(characterLink(content, name)).toBeVisible();

      const menu = await openCharacterActions(gm.page, content, name);
      await menu.getByRole("menuitem", { name: "Exporter en PDF" }).click();
      const download = await exportFromDialog(gm.page);
      expect(pdfPageCount(await readPdf(download))).toBe(2);
    } finally {
      await deleteCampaignWithGroups(gm.api, campaign._id).catch(() => undefined);
    }
  });

  test("des textes très longs n'empêchent pas l'export", async ({ player, seeded }) => {
    const paragraph = "Né dans les Marches du Nord, il a juré de retrouver la lame perdue de son ordre. ".repeat(80);
    const character = await seeded.player(player.api, uniqueLabel("Bavard"), {
      spellcasting: [WIZARD],
      background: {
        personalityTraits: paragraph,
        ideals: paragraph,
        bonds: paragraph,
        flaws: paragraph,
        alliesAndOrgs: paragraph,
        backstory: paragraph.repeat(3),
      },
    });
    await openSheet(player.page, character._id);

    await player.page.getByRole("button", { name: "Exporter la fiche en PDF" }).click();
    const download = await exportFromDialog(player.page);
    await expect(player.page.getByText("Impossible d'exporter la fiche en PDF.")).toHaveCount(0);
    expect(pdfPageCount(await readPdf(download))).toBeGreaterThanOrEqual(3);
  });

  test("Annuler ou Échap ferme le dialogue sans télécharger", async ({ player, seeded }) => {
    const character = await seeded.player(player.api, uniqueLabel("Indécis"));
    await openSheet(player.page, character._id);
    const downloads = countDownloads(player.page);
    const trigger = player.page.getByRole("button", { name: "Exporter la fiche en PDF" });
    const { dialog, dark, light } = exportDialog(player.page);

    await test.step("Annuler", async () => {
      await trigger.click();
      await light.click();
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("Échap, et le thème revient à Sombre à la réouverture", async () => {
      await trigger.click();
      await expect(dark).toHaveAttribute("aria-pressed", "true");
      await player.page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });

    await expect(player.page.getByText("Fiche exportée en PDF.")).toHaveCount(0);
    expect(downloads.count).toBe(0);
  });

  test("l'export d'un PNJ reste visible mais désactivé (bientôt disponible)", async ({ player, seeded }, testInfo) => {
    const name = uniqueLabel("PNJ sans PDF");
    const npc = await seeded.npc(player.api, name);
    const downloads = countDownloads(player.page);

    await test.step("sur la fiche : bouton désactivé, raison annoncée", async () => {
      await openSheet(player.page, npc._id);
      const button = player.page.getByRole("button", {
        name: "Exporter la fiche en PDF — bientôt disponible pour les PNJ",
      });
      await expect(button).toBeVisible();
      await expect(button).toBeDisabled();
      if (canHover(testInfo)) {
        await button.hover({ force: true });
        await expect(
          player.page.getByRole("tooltip").filter({ hasText: "Export PDF des PNJ bientôt disponible" }),
        ).toBeVisible();
      }
    });

    await test.step("dans la sidebar : action désactivée, sans dialogue", async () => {
      const nav = await openPlayerSpace(player.page);
      const menu = await openCharacterActions(player.page, nav, name);
      const item = menu.getByRole("menuitem", { name: "Exporter en PDF" });
      await expect(item).toBeDisabled();
      if (canHover(testInfo)) {
        await item.hover();
        await expect(
          player.page.getByRole("tooltip").filter({ hasText: "Export PDF des PNJ bientôt disponible" }),
        ).toBeVisible();
      }
      await item.click({ force: true });
      await expect(exportDialog(player.page).dialog).toHaveCount(0);
    });

    expect(downloads.count).toBe(0);
  });

  test("si la fiche ne peut pas être chargée, un toast d'erreur s'affiche et aucun dialogue ne s'ouvre", async ({
    player,
    seeded,
  }) => {
    const name = uniqueLabel("Injoignable");
    const character = await seeded.player(player.api, name);
    const nav = await openPlayerSpace(player.page);
    await expect(characterLink(nav, name)).toBeVisible();
    await player.page.route(`**/characters/${character._id}*`, (route) =>
      route.request().method() === "GET" ? route.abort("failed") : route.fallback(),
    );

    const menu = await openCharacterActions(player.page, nav, name);
    await menu.getByRole("menuitem", { name: "Exporter en PDF" }).click();

    await expect(player.page.getByText("Impossible d'exporter la fiche en PDF.")).toBeVisible();
    await expect(exportDialog(player.page).dialog).toHaveCount(0);
  });
});
