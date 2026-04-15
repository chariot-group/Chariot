import { z } from 'zod';
import { makeZodMessages } from '@/lib/zodErrorMap';


type ZodMessages = ReturnType<typeof makeZodMessages>;

// ===== Helpers =====
/**
 * Helper pour les champs numériques qui acceptent des strings en saisie
 * Valide que la string est un nombre valide et la convertit en number pour l'envoi
 */
const numericInput = (optional = false) => {
    const schema = z.coerce.number();
    return optional ? schema.optional() : schema;
};

// ===== Enums =====
export const AlignmentEnum = z.enum([
    'Lawful Good',
    'Neutral Good',
    'Chaotic Good',
    'Lawful Neutral',
    'True Neutral',
    'Chaotic Neutral',
    'Lawful Evil',
    'Neutral Evil',
    'Chaotic Evil',
    'Unaligned',
    'Any Good Alignment',
    'Any Evil Alignment',
    'Any Lawful Alignment',
    'Any Chaotic Alignment',
]);

export const ClassNameEnum = z.enum([
    'Artificer',
    'Barbarian',
    'Bard',
    'Cleric',
    'Druid',
    'Fighter',
    'Monk',
    'Paladin',
    'Ranger',
    'Rogue',
    'Sorcerer',
    'Warlock',
    'Wizard',
]);

// ===== Stats Sub-Schemas =====
export const SpeedSchema = z.object({
    walk: numericInput(true),
    climb: numericInput(true),
    swim: numericInput(true),
    fly: numericInput(true),
    burrow: numericInput(true),
});

export const AbilityScoresSchema = z.object({
    strength: numericInput(true),
    dexterity: numericInput(true),
    constitution: numericInput(true),
    intelligence: numericInput(true),
    wisdom: numericInput(true),
    charisma: numericInput(true),
});

export const AbilityScoreKeyEnum = z.enum([
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
]);

export const SavingThrowsSchema = z.object({
    strength: numericInput(true),
    dexterity: numericInput(true),
    constitution: numericInput(true),
    intelligence: numericInput(true),
    wisdom: numericInput(true),
    charisma: numericInput(true),
});

export const SkillSchema = z.object({
    athletics: numericInput(true),
    acrobatics: numericInput(true),
    sleightHand: numericInput(true),
    stealth: numericInput(true),
    arcana: numericInput(true),
    history: numericInput(true),
    investigation: numericInput(true),
    nature: numericInput(true),
    religion: numericInput(true),
    animalHandling: numericInput(true),
    insight: numericInput(true),
    medicine: numericInput(true),
    perception: numericInput(true),
    survival: numericInput(true),
    deception: numericInput(true),
    intimidation: numericInput(true),
    performance: numericInput(true),
    persuasion: numericInput(true),
});

export const SenseSchema = z.object({
    name: z.string().optional(),
    value: numericInput(true),
});

// ===== Stats =====
export const StatsSchema = z.object({
    size: z.string().default('Medium'), // REQUIRED dans Mongoose
    maxHitPoints: numericInput(true),
    currentHitPoints: numericInput(true),
    tempHitPoints: numericInput(true),
    armorClass: numericInput(true),
    initiative: numericInput(true),
    speed: SpeedSchema.optional(),
    abilityScores: AbilityScoresSchema.optional(),
    languages: z.array(z.string()).optional(),
    passivePerception: numericInput(true),
    savingThrows: SavingThrowsSchema.optional(),
    skills: SkillSchema.optional(),
    senses: z.array(SenseSchema).optional(),
});

// ===== Affinities =====
export const AffinitiesSchema = z.object({
    resistances: z.array(z.string()).optional(),
    immunities: z.array(z.string()).optional(),
    vulnerabilities: z.array(z.string()).optional(),
});

// ===== Ability =====
export function AbilitySchema(zm: ZodMessages) {
    return z.object({
        name: z.string({ message: zm.required() }).min(1, { message: zm.minString(1) }),
        description: z.string().optional(),
    })
};

// ===== Spellcasting =====
const DamageDetailsSchema = z.object({
    diceCount: z.coerce.number().nullable().optional(),
    diceType: z.string().nullable().optional(),
    bonus: z.coerce.number().nullable().optional(),
    damageType: z.string().nullable().optional(),
}).nullish();

const HealingDetailsSchema = z.object({
    diceCount: z.coerce.number().nullable().optional(),
    diceType: z.string().nullable().optional(),
    bonus: z.coerce.number().nullable().optional(),
}).nullish();

export const SpellSchema = z.object({
    name: z.string().optional(),
    level: numericInput(true),
    school: z.string().optional(),
    description: z.string().optional(),
    components: z.array(z.string()).optional(),
    castingTime: z.string().optional(),
    duration: z.string().optional(),
    range: z.string().optional(),
    effectType: z.enum(['attack', 'heal', 'utility']).optional(),
    damage: z.string().optional(),
    healing: z.string().optional(),
    damageDetails: DamageDetailsSchema,
    healingDetails: HealingDetailsSchema,
    usesPerDay: z.number().nullable().optional(),
    used: numericInput(true),
});

export const SpellSlotSchema = z.object({
    total: numericInput(true),
    used: numericInput(true),
});

export const SpellcastingSchema = z.object({
    className: z.string().optional(),
    ability: z.string().optional(),
    saveDC: numericInput(true),
    attackBonus: numericInput(true),
    isInnate: z.boolean().optional(),
    spellSlotsByLevel: z.record(z.string(), SpellSlotSchema).optional(),
    spellSlotsByUses: z.preprocess((val) => {
        if (val === null || val === undefined) return val;
        // RHF peut avoir converti un objet à clés numériques en tableau
        if (Array.isArray(val)) {
            const obj: Record<string, unknown> = {};
            (val as unknown[]).forEach((item, i) => {
                if (item != null) obj[`k${i}`] = item;
            });
            return obj;
        }
        if (typeof val === 'object') {
            const obj: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
                obj[/^\d+$/.test(k) ? `k${k}` : k] = v;
            }
            return obj;
        }
        return val;
    }, z.record(z.string(), z.number().nullable()).optional()),
    totalSlots: numericInput(true),
    spells: z.array(SpellSchema).optional(),
});

// ===== Appearance =====
export const AppearanceSchema = z.object({
    age: z.coerce.number().min(0).optional(),
    height: z.coerce.number().min(0).optional(),
    weight: z.coerce.number().min(0).optional(),
    eyes: z.string().optional(),
    skin: z.string().optional(),
    hair: z.string().optional(),
    description: z.string().optional(),
});

// ===== Background =====
export const BackgroundSchema = z.object({
    personalityTraits: z.string().optional(),
    ideals: z.string().optional(),
    bonds: z.string().optional(),
    flaws: z.string().optional(),
    alliesAndOrgs: z.string().optional(),
    backstory: z.string().optional(),
});

// ===== Treasure =====
export const TreasureSchema = z.object({
    cp: z.coerce.number().min(0).optional(),
    sp: z.coerce.number().min(0).optional(),
    ep: z.coerce.number().min(0).optional(),
    gp: z.coerce.number().min(0).optional(),
    pp: z.coerce.number().min(0).optional(),
    treasure: z.string().optional(),
    equipment: z.string().optional(),
});

// ===== Conditions =====
export const ConditionsSchema = z.object({
    blinded: z.boolean().optional(),
    charmed: z.boolean().optional(),
    deafened: z.boolean().optional(),
    frightened: z.boolean().optional(),
    grappled: z.boolean().optional(),
    incapacitated: z.boolean().optional(),
    invisible: z.boolean().optional(),
    paralyzed: z.boolean().optional(),
    petrified: z.boolean().optional(),
    poisoned: z.boolean().optional(),
    prone: z.boolean().optional(),
    restrained: z.boolean().optional(),
    stunned: z.boolean().optional(),
    unconscious: z.boolean().optional(),
});

// ===== Actions =====
export const DamageSchema = z.object({
    dice: z.string().optional(),
    applyAbilityBonus: z.boolean().optional(),
    type: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || !/\s/.test(value), {
            message: "Only one damage type is allowed per damage entry.",
        }),
});

export const DifficultyClassSchema = z.object({
    dcType: z.string().optional(),
    dcValue: z.coerce.number().int().min(0).optional(),
    successType: z.string().optional(),
});

export const ActionUsageTypeEnum = z.enum(["action", "bonus_action", "reaction"]);

export function ActionSchema(zm: ZodMessages) {
    return z
        .object({
            name: z.string({ message: zm.required() }).min(1, { message: zm.minString(1) }).optional(),
            type: z.string().optional(),
            usageType: ActionUsageTypeEnum.default("action"),
            attackAbility: AbilityScoreKeyEnum.optional(),
            description: z.string().optional(),
            attackBonus: numericInput(true),
            damage: z.array(DamageSchema).optional(),
            range: z.string().optional(),
            dc: DifficultyClassSchema.optional().nullable(),
            cost: numericInput(true),
        })
        .superRefine((action, ctx) => {
            const seenTypes = new Set<string>();

            (action.damage ?? []).forEach((damage, damageIndex) => {
                const normalizedType = (damage.type ?? "").trim().toLowerCase();
                if (!normalizedType) return;

                if (seenTypes.has(normalizedType)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Each damage type must be unique within an action.",
                        path: ["damage", damageIndex, "type"],
                    });
                    return;
                }

                seenTypes.add(normalizedType);
            });
        });
};
