import { z } from 'zod';
import { createCharacterSchema } from '@/schemas/character/character.schema';
import { ActionSchema, AlignmentEnum, preprocessActionArrayRows } from '@/schemas/character/base.schema';
import { makeZodMessages } from '@/lib/zodErrorMap';

type ZodMessages = ReturnType<typeof makeZodMessages>;

// ===== NPC Actions =====
export function ActionsSchema(zm: ZodMessages) {
    return z.object({
        standard: z.preprocess(preprocessActionArrayRows, z.array(ActionSchema(zm)).optional()),
        legendary: z.preprocess(preprocessActionArrayRows, z.array(ActionSchema(zm)).optional()),
        lair: z.preprocess(preprocessActionArrayRows, z.array(ActionSchema(zm)).optional()),
    });
};

// ===== Challenge =====
export const ChallengeSchema = z.object({
    challengeRating: z.coerce.number().optional(),
    experiencePoints: z.coerce.number().optional(),
});

// ===== NPC Profile =====
export const NPCProfileSchema = z.object({
    alignment: AlignmentEnum.optional(),
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
        actions: ActionsSchema(zm).optional(),
        challenge: ChallengeSchema.optional(),
        profile: NPCProfileSchema.optional(),
        hitPointsRoll: z.string().optional(),
    });
}

export type CreateNpcInput = z.infer<ReturnType<typeof createNpcSchema>>;
