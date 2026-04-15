import { z } from 'zod';
import {
    StatsSchema,
    AffinitiesSchema,
    AbilitySchema,
    SpellcastingSchema,
    AppearanceSchema,
    BackgroundSchema,
    TreasureSchema,
    ConditionsSchema,
} from '@/schemas/character/base.schema';
import { makeZodMessages } from '@/lib/zodErrorMap';

type ZodMessages = ReturnType<typeof makeZodMessages>;

/**
 * Factory function pour créer le schéma de base de création de character avec messages traduits
 * @param zm - Helper de messages Zod traduits (créé via makeZodMessages)
 * @returns Schéma de validation Zod pour la création de character
 */
export function createCharacterSchema(zm: ZodMessages) {
    return z.object({
        firstname: z.string({ message: zm.required() }).trim().min(1, { message: zm.required() }),

        lastname: z.string().optional(),
        surname: z.string().optional(),
        avatar: z.string().optional(),

        stats: StatsSchema.optional(),
        affinities: AffinitiesSchema.optional(),
        abilities: z.array(AbilitySchema(zm)).optional(),
        spellcasting: z.array(SpellcastingSchema).optional(),
        appearance: AppearanceSchema.optional(),
        background: BackgroundSchema.optional(),
        treasure: TreasureSchema.optional(),
        conditions: ConditionsSchema.optional(),
        groups: z.array(
            z.union([
                z.string({ message: zm.required() }),
                z.object({
                    _id: z.string({ message: zm.required() }),
                }).passthrough(),
            ])
        ).optional(),
    });
}

export type CreateCharacterInput = z.infer<ReturnType<typeof createCharacterSchema>>;
