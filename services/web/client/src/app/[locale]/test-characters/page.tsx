"use client";

import { useState } from "react";
import { useCharacterForm, CharacterType } from "@/hooks/useCharacterForm";
import { Player, NPC } from "@/types/character";

/**
 * Page de test pour valider le hook useCharacterForm et les routes API backend
 *
 * Cette page permet de tester :
 * - Création de Player
 * - Création de NPC
 * - Modification de Player
 * - Modification de NPC
 */
export default function TestCharactersPage() {
  const [testCharacterId, setTestCharacterId] = useState<string | null>(null);
  const [testCharacterType, setTestCharacterType] = useState<CharacterType>("players");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Hook pour tester Player
  const playerFormCreate = useCharacterForm({
    characterId: null,
    type: "players",
    onSuccess: (data) => {
      addLog(`✅ Player créé avec succès - ID: ${data._id}`);
      setTestCharacterId(data._id);
      setTestCharacterType("players");
    },
  });

  // Hook pour tester NPC
  const npcFormCreate = useCharacterForm({
    characterId: null,
    type: "npcs",
    onSuccess: (data) => {
      addLog(`✅ NPC créé avec succès - ID: ${data._id}`);
      setTestCharacterId(data._id);
      setTestCharacterType("npcs");
    },
  });

  // Hook pour tester modification
  const updateForm = useCharacterForm({
    characterId: testCharacterId,
    type: testCharacterType,
    onSuccess: (data) => {
      addLog(`✅ ${testCharacterType === "players" ? "Player" : "NPC"} mis à jour - ID: ${data._id}`);
    },
  });

  // Données de test pour Player
  const createTestPlayer = async () => {
    addLog("🔄 Création d'un Player de test...");
    const testPlayerData = {
      firstname: "Test",
      lastname: "Player",
      inspiration: false,
      stats: {
        size: "Medium",
      },
      class: [
        {
          name: "Fighter",
          level: 3,
        },
      ],
      profile: {
        alignment: "Neutral Good",
        race: "Human",
      },
    };

    console.log("📤 Données envoyées (Player):", JSON.stringify(testPlayerData, null, 2));

    try {
      await playerFormCreate.onCreate(testPlayerData as any);
    } catch (error) {
      addLog(`❌ Erreur création Player: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Erreur complète:", error);
    }
  };

  // Données de test pour NPC
  const createTestNPC = async () => {
    addLog("🔄 Création d'un NPC de test...");
    const testNPCData = {
      firstname: "Test",
      lastname: "NPC",
      stats: {
        size: "Medium",
      },
      profile: {
        alignment: "Lawful Neutral",
        type: "Humanoid",
      },
    };

    console.log("📤 Données envoyées (NPC):", JSON.stringify(testNPCData, null, 2));

    try {
      await npcFormCreate.onCreate(testNPCData as any);
    } catch (error) {
      addLog(`❌ Erreur création NPC: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Erreur complète:", error);
    }
  };

  // Test de modification
  const updateTestCharacter = async () => {
    if (!testCharacterId) {
      addLog("⚠️ Aucun personnage à modifier. Créez-en un d'abord.");
      return;
    }

    addLog(`🔄 Modification du ${testCharacterType === "players" ? "Player" : "NPC"} ${testCharacterId}...`);

    const updatedData = {
      firstname: "Updated",
      surname: "Modified by Test",
    };

    try {
      await updateForm.onUpdate(updatedData as any);
    } catch (error) {
      addLog(`❌ Erreur modification: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 ">🧪 Test Characters API</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Panel de Création */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Création</h2>

            <div className="space-y-3">
              <button
                onClick={createTestPlayer}
                disabled={playerFormCreate.isSaving}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
                {playerFormCreate.isSaving ? "⏳ Création..." : "➕ Créer un Player"}
              </button>

              <button
                onClick={createTestNPC}
                disabled={npcFormCreate.isSaving}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
                {npcFormCreate.isSaving ? "⏳ Création..." : "➕ Créer un NPC"}
              </button>
            </div>

            {/* État de chargement */}
            {(playerFormCreate.isLoading || npcFormCreate.isLoading) && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">⏳ Chargement en cours...</div>
            )}

            {/* Erreurs */}
            {(playerFormCreate.error || npcFormCreate.error) && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                ❌ Erreur: {playerFormCreate.error || npcFormCreate.error}
              </div>
            )}
          </div>

          {/* Panel de Modification */}
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Modification</h2>

            {testCharacterId ? (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-600 mb-1">Personnage sélectionné :</p>
                  <p className="font-mono text-gray-900">
                    {testCharacterType === "players" ? "👤 Player" : "🤖 NPC"}: {testCharacterId}
                  </p>
                </div>

                <button
                  onClick={updateTestCharacter}
                  disabled={updateForm.isSaving}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
                  {updateForm.isSaving ? "⏳ Modification..." : "✏️ Modifier le personnage"}
                </button>

                <button
                  onClick={() => {
                    setTestCharacterId(null);
                    addLog("🔄 Sélection réinitialisée");
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                  🔄 Réinitialiser la sélection
                </button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                ℹ️ Créez un personnage d'abord pour tester la modification
              </div>
            )}

            {updateForm.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">❌ Erreur: {updateForm.error}</div>
            )}
          </div>
        </div>

        {/* Panel de Logs */}
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📋 Logs d'activité</h2>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
              🗑️ Effacer
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucun log pour le moment...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${
                      log.includes("✅")
                        ? "text-green-400"
                        : log.includes("❌")
                          ? "text-red-400"
                          : log.includes("⚠️")
                            ? "text-yellow-400"
                            : "text-gray-300"
                    }`}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
