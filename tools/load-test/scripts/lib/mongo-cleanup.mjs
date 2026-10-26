import { MongoClient } from "mongodb";

/**
 * Nettoie Adventure Mongo pour les keycloakId du manifest (optionnel si ADVENTURE_MONGODB_URI absent).
 * @param {string[]} keycloakIds
 */
export async function cleanupAdventureMongo(keycloakIds) {
  const uri = process.env.ADVENTURE_MONGODB_URI?.trim();
  if (!uri) {
    console.warn(
      "ADVENTURE_MONGODB_URI absent : skip nettoyage Mongo (campagnes soft-delete + suppression Keycloak uniquement).",
    );
    return { skipped: true };
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    const users = db.collection("users");
    const campaigns = db.collection("campaigns");
    const characters = db.collection("characters");

    const userResult = await users.deleteMany({ keycloakId: { $in: keycloakIds } });
    const campaignResult = await campaigns.deleteMany({ createdBy: { $in: keycloakIds } });
    const characterResult = await characters.deleteMany({ createdBy: { $in: keycloakIds } });

    return {
      skipped: false,
      users: userResult.deletedCount,
      campaigns: campaignResult.deletedCount,
      characters: characterResult.deletedCount,
    };
  } finally {
    await client.close();
  }
}
