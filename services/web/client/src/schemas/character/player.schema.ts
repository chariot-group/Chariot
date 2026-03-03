import { z } from 'zod';
import { createCharacterSchema } from '@/schemas/character/character.schema';
import { ActionSchema, ClassNameEnum, AlignmentEnum, StatsSchema } from '@/schemas/character/base.schema';
import { makeZodMessages } from '@/lib/zodErrorMap';


type ZodMessages = ReturnType<typeof makeZodMessages>;

// ===== Player Stats =====
export function createPlayerMasteriesSchema(zm: ZodMessages) {
    return z.object({
        athletics: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        acrobatics: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        sleightHand: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        stealth: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        arcana: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        history: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        investigation: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        nature: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        religion: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        animalHandling: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        insight: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        medicine: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        perception: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        survival: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        deception: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        intimidation: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        performance: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
        persuasion: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }),
    });
}

export const PlayerMasteriesAbilitySchema = z.object({
    strength: z.boolean().optional(),
    dexterity: z.boolean().optional(),
    constitution: z.boolean().optional(),
    intelligence: z.boolean().optional(),
    wisdom: z.boolean().optional(),
    charisma: z.boolean().optional(),
});

export function createPlayerStatsSchema(zm: ZodMessages) {
    return StatsSchema.extend({
        proficiencyBonus: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }).optional(),
        armors: z.array(z.string({ message: zm.required() })).optional(),
        weapons: z.array(z.string({ message: zm.required() })).optional(),
        tools: z.array(z.string({ message: zm.required() })).optional(),
        masteries: createPlayerMasteriesSchema(zm).optional(),
        masteriesAbility: PlayerMasteriesAbilitySchema.optional(),
    });
}

// ===== Death Saves =====
export function createDeathSavesSchema(zm: ZodMessages) {
    return z.object({
        successes: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }).max(3, { message: zm.maxNumber(3) }).optional(),
        failures: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }).max(3, { message: zm.maxNumber(3) }).optional(),
    });
}

// ===== Progression =====
export const ProgressionSchema = z.object({
    level: z.number().optional(),
    experience: z.number().optional(),
});

// ===== Class =====
export const ClassSchema = z.object({
    name: ClassNameEnum, // REQUIRED
    subclass: z.string().optional(),
    level: z.number().optional(),
    hitDice: z.number().optional(),
});

// ===== Player Profile =====
export const PlayerProfileSchema = z.object({
    alignment: AlignmentEnum, // REQUIRED
    race: z.string().optional(),
    subrace: z.string().optional(),
    history: z.string().optional(),
});

/**
 * Factory function pour créer le schéma de création de player avec messages traduits
 * @param zm - Helper de messages Zod traduits (créé via makeZodMessages)
 * @returns Schéma de validation Zod pour la création de player
 */
export function createPlayerSchema(zm: ZodMessages) {
    return createCharacterSchema(zm).extend({
        actions: z.array(ActionSchema(zm)).optional(),

        inspiration: z.boolean({ message: zm.required() }).optional(),

        progression: ProgressionSchema.optional(),
        class: z.array(ClassSchema).optional(),
        profile: PlayerProfileSchema.optional(),
        stats: createPlayerStatsSchema(zm).optional(),
        exhaustionLevel: z.number({ message: zm.required() }).int().min(0, { message: zm.minNumber(0) }).max(6, { message: zm.maxNumber(6) }).optional(),
        deathSaves: createDeathSavesSchema(zm).optional(),
    });
}

// Export type basé sur un schéma par défaut (pour typing statique)
const DefaultPlayerSchema = createPlayerSchema({
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

export type CreatePlayerInput = z.infer<typeof DefaultPlayerSchema>;
