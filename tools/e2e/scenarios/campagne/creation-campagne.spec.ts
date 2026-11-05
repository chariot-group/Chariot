import { env, uniqueLabel } from "@/env";
import { createCampaignFromWelcome, deleteCampaignsByLabel } from "@/flows";
import { expect, test } from "@/fixtures";

test.describe("Création de campagne", () => {
  test("le MJ crée une campagne depuis l'accueil", async ({ gm }) => {
    const label = uniqueLabel("Campagne");

    try {
      await createCampaignFromWelcome(gm.page, label);

      await test.step("la campagne existe côté API", async () => {
        const campaigns = await gm.api.listCampaigns();
        expect(campaigns.map((c) => c.label)).toContain(label);
      });
    } finally {
      await deleteCampaignsByLabel(gm.api, label);
    }
  });

  test("le bouton Sauvegarder reste désactivé sans nom", async ({ gm }) => {
    await gm.page.goto(`/${env.locale}/welcome`);
    await gm.page.getByRole("button", { name: "Naviguer vers la création de campagne" }).click();

    const dialog = gm.page.getByRole("dialog", { name: "Créer une nouvelle campagne" });
    await dialog.getByLabel("Nom de la campagne").fill("   ");
    await expect(dialog.getByRole("button", { name: "Sauvegarder" })).toBeDisabled();
  });
});
