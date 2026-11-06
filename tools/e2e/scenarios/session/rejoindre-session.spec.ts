import { env, uniqueLabel } from "@/env";
import { createCampaignFromWelcome, deleteCampaignsByLabel, launchSessionFromSidebar } from "@/flows";
import { expect, test } from "@/fixtures";

/**
 * Scénario multi-utilisateur : un MJ et un joueur, chacun dans son navigateur.
 * Couvre FR-session-websocket-lifecycle (roster temps réel, période de grâce à la déconnexion)
 * et FR-session-participant-labels (libellé du personnage dans le lobby).
 */
test.describe("Session MJ / joueur", () => {
  test("le joueur rejoint par lien d'invitation et le MJ le voit en temps réel", async ({ gm, player }) => {
    const campaignLabel = uniqueLabel("Session");
    const characterName = uniqueLabel("Aria");
    const character = await player.api.createPlayer(characterName);
    let code: string | undefined;

    try {
      await test.step("MJ : créer une campagne et lancer une session", async () => {
        await createCampaignFromWelcome(gm.page, campaignLabel);
        code = await launchSessionFromSidebar(gm.page);
        await expect(gm.page.getByRole("dialog")).toBeVisible();
      });

      await test.step("Joueur : ouvrir le lien d'invitation et choisir son personnage", async () => {
        // Fiche personnage plutôt que /welcome : évite la redirection post-auth (FR-post-auth-navigation).
        await player.page.goto(`/${env.locale}/characters/${character._id}?join=${code}`);

        const dialog = player.page.getByRole("dialog", { name: "Rejoindre une session" });
        await expect(dialog).toBeVisible();
        await dialog.getByRole("combobox").click();
        await player.page.getByRole("option", { name: new RegExp(escapeRegExp(characterName)) }).click();
        await dialog.getByRole("button", { name: "Rejoindre la session" }).click();
        await expect(dialog).toBeHidden();
      });

      await test.step("MJ : le personnage du joueur apparaît dans le lobby sans recharger", async () => {
        await expect(gm.page.getByRole("dialog").getByText(characterName)).toBeVisible();
      });

      await test.step("Joueur : rafraîchir la page ne déclenche pas de faux toast de déconnexion", async () => {
        await player.page.reload();
        // Période de grâce gateway = 3 s : on attend au-delà avant de vérifier l'absence de toast.
        await gm.page.waitForTimeout(5_000);
        await expect(gm.page.getByText(/s'est déconnecté de la session/)).toHaveCount(0);
        await expect(gm.page.getByRole("dialog").getByText(characterName)).toBeVisible();
      });
    } finally {
      if (code) {
        await player.api.leaveSession(code).catch(() => undefined);
        await gm.api.leaveSession(code).catch(() => undefined);
      }
      await deleteCampaignsByLabel(gm.api, campaignLabel);
      await player.api.deleteCharacter(character._id);
    }
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
