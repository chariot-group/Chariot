import { z } from 'zod';
import { createCharacterSchema } from '@/schemas/character/character.schema';
import { ActionSchema, ClassNameEnum, AlignmentEnum, StatsSchema } from '@/schemas/character/base.schema';
import { makeZodMessages } from '@/lib/zodErrorMap';


type ZodMessages = ReturnType<typeof makeZodMessages>;

export const DEFAULT_PLAYER_MASTERIES = {
    athletics: 0,
    acrobatics: 0,
    sleightHand: 0,
    stealth: 0,
    arcana: 0,
    history: 0,
    investigation: 0,
    nature: 0,
    religion: 0,
    animalHandling: 0,
    insight: 0,
    medicine: 0,
    perception: 0,
    survival: 0,
    deception: 0,
    intimidation: 0,
    performance: 0,
    persuasion: 0,
} as const;

// ===== Player Stats =====
export function createPlayerMasteriesSchema(zm: ZodMessages) {
    return z.object({
        athletics: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        acrobatics: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        sleightHand: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        stealth: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        arcana: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        history: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        investigation: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        nature: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        religion: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        animalHandling: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        insight: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        medicine: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        perception: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        survival: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        deception: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        intimidation: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        performance: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
        persuasion: z.coerce.number().int().min(0, { message: zm.minNumber(0) }),
    }).default(DEFAULT_PLAYER_MASTERIES);
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
        proficiencyBonus: z.coerce.number().int().min(0, { message: zm.minNumber(0) }).optional(),
        armors: z.array(z.string({ message: zm.required() })).optional(),
        weapons: z.array(z.string({ message: zm.required() })).optional(),
        tools: z.array(z.string({ message: zm.required() })).optional(),
        masteries: createPlayerMasteriesSchema(zm),
        masteriesAbility: PlayerMasteriesAbilitySchema.optional(),
    });
}

// ===== Death Saves =====
export function createDeathSavesSchema(zm: ZodMessages) {
    return z.object({
        successes: z.coerce.number().int().min(0, { message: zm.minNumber(0) }).max(3, { message: zm.maxNumber(3) }).optional(),
        failures: z.coerce.number().int().min(0, { message: zm.minNumber(0) }).max(3, { message: zm.maxNumber(3) }).optional(),
    });
}

// ===== Progression =====
export const ProgressionSchema = z.object({
    level: z.coerce.number().optional(),
    experience: z.coerce.number().optional(),
});

// ===== Class =====
export function ClassSchema(zm: ZodMessages) {
    return z.object({
        name: z.string().or(ClassNameEnum).superRefine((value, ctx) => {
            if (value === "" || value === undefined || value === null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: zm.required(),
                });
                return z.NEVER;
            }
        }),
        subclass: z.string().optional(),
        level: z.coerce.number().optional(),
        hitDice: z.coerce.number().optional(),
        hitDiceRemaining: z.coerce.number().int().min(0, { message: zm.minNumber(0) }).optional(),
    })
        .superRefine((data, ctx) => {
            const { level: lvlRaw, hitDiceRemaining: remRaw } = data;
            if (remRaw === undefined || remRaw === null) return;
            if (typeof lvlRaw !== 'number' || Number.isNaN(lvlRaw)) return;
            const lvl = Math.floor(lvlRaw);
            const rem = Math.floor(remRaw);
            if (rem > lvl) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: zm.maxNumber(lvl),
                    path: ['hitDiceRemaining'],
                });
            }
        });
}

// ===== Player Profile =====
export const PlayerProfileSchema = z.object({
    alignment: AlignmentEnum, // REQUIRED
    race: z.preprocess((value) => (value === null ? "" : value), z.string().optional()),
    subrace: z.preprocess((value) => (value === null ? "" : value), z.string().optional()),
    history: z.preprocess((value) => (value === null ? "" : value), z.string().optional()),
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
        class: z.array(ClassSchema(zm)).optional(),
        profile: PlayerProfileSchema.optional(),
        stats: createPlayerStatsSchema(zm).optional(),
        exhaustionLevel: z.coerce.number().int().min(0, { message: zm.minNumber(0) }).max(6, { message: zm.maxNumber(6) }).optional(),
        deathSaves: createDeathSavesSchema(zm).optional(),
    }).superRefine((data, ctx) => {
        const prog = data.progression?.level;
        const cls = data.class;
        if (prog === undefined || prog === null || typeof prog !== 'number' || Number.isNaN(prog))
            return;
        if (!Array.isArray(cls) || cls.length === 0)
            return;

        const globalLevel = Math.floor(prog);
        let sumLevels = 0;
        const levels = cls.map((c, i) => {
            const lv =
                typeof c?.level === 'number' && !Number.isNaN(c.level)
                    ? Math.max(0, Math.floor(c.level))
                    : 0;
            sumLevels += lv;
            return { i, lv };
        });

        levels.forEach(({ i, lv }) => {
            const sumOthers = sumLevels - lv;
            const maxAllowed = globalLevel - sumOthers;
            if (lv > maxAllowed) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: zm.classLevelTotalsVsGlobalHitDice(sumLevels, globalLevel),
                    path: ['class', i, 'hitDiceRemaining'],
                });
            }
        });
    });
}

export type CreatePlayerInput = z.infer<ReturnType<typeof createPlayerSchema>>;
