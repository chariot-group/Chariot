import { makeZodMessages } from "@/lib/zodErrorMap";
import type { CodexCreateSelection } from "@/lib/codexCharacterCreate";
import {
  prepareCodexCharacterCreateData,
  type CodexCharacterCreateContext,
} from "@/lib/prepareCodexCharacterCreateData";
import { createNpcSchema, createPlayerSchema } from "@/schemas/character";
import CharacterService, { type CharacterWriteData } from "@/services/CharacterService";
import type { NPC, Player } from "@/types/character";

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

export async function createCharactersFromCodexSelections(
  selections: CodexCreateSelection[],
  context: CodexCharacterCreateContext,
  tZod: Translate,
): Promise<(Player | NPC)[]> {
  const zm = makeZodMessages(tZod);
  const playerSchema = createPlayerSchema(zm);
  const npcSchema = createNpcSchema(zm);
  const created: (Player | NPC)[] = [];

  for (const selection of selections) {
    const prepared = prepareCodexCharacterCreateData(selection, context);
    if (selection.kind === "player") {
      // Zod output types conditions/stats more loosely than the domain types; same cast as useCharacterForm.
      const parsed = (await playerSchema.parseAsync(prepared)) as CharacterWriteData;
      const character = await CharacterService.createCharacter("players", parsed);
      created.push(character);
    } else {
      const parsed = (await npcSchema.parseAsync(prepared)) as CharacterWriteData;
      const character = await CharacterService.createCharacter("npcs", parsed);
      created.push(character);
    }
  }

  return created;
}
