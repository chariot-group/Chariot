import { z } from 'zod';
import { createCharacterSchema } from '@/schemas/character/character.schema';
import { ActionSchema, AlignmentEnum } from '@/schemas/character/base.schema';
import { makeZodMessages } from '@/lib/zodErrorMap';

type ZodMessages = ReturnType<typeof makeZodMessages>;

// ===== NPC Actions =====
export const ActionsSchema = z.object({
    standard: z.array(ActionSchema).optional(),
    legendary: z.array(ActionSchema).optional(),
    lair: z.array(ActionSchema).optional(),
});

// ===== Challenge =====
export const ChallengeSchema = z.object({
    challengeRating: z.number().optional(),
    experiencePoints: z.number().optional(),
});

// ===== NPC Profile =====
export const NPCProfileSchema = z.object({
    alignment: AlignmentEnum,
    type: z.string().optional(),
    subtype: z.string().optional(),
});

/**
 * Factory function pour créer le schéma de création de NPC avec messages traduits
 * @param zm - Helper de messages Zod traduits (créé via makeZodMessages)
 * @returns Schéma de validation Zod pour la création de NPC
 */
export function createNpcSchema(zm: ZodMessages) {
    return createCharacterSchema(zm).extend({
        actions: ActionsSchema.optional(),
        challenge: ChallengeSchema.optional(),
        profile: NPCProfileSchema.optional(),
        hitPointsRoll: z.string().optional(),
    });
}

// Export schéma par défaut pour rétrocompatibilité
const DefaultNpcSchema = createNpcSchema({
    required: () => '',
    invalidType: () => '',
    minString: () => '',
    maxString: () => '',
    minNumber: () => '',
    maxNumber: () => '',
    email: () => '',
    url: () => '',
    uuid: () => '',
    minArray: () => '',
    maxArray: () => '',
    notMultipleOf: () => '',
});

export type CreateNpcInput = z.infer<typeof DefaultNpcSchema>;
