import { z } from 'zod';
import { makeZodMessages } from '@/lib/zodErrorMap';


type ZodMessages = ReturnType<typeof makeZodMessages>;

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
    walk: z.number().optional(),
    climb: z.number().optional(),
    swim: z.number().optional(),
    fly: z.number().optional(),
    burrow: z.number().optional(),
});

export const AbilityScoresSchema = z.object({
    strength: z.number().optional(),
    dexterity: z.number().optional(),
    constitution: z.number().optional(),
    intelligence: z.number().optional(),
    wisdom: z.number().optional(),
    charisma: z.number().optional(),
});

export const SavingThrowsSchema = z.object({
    strength: z.number().optional(),
    dexterity: z.number().optional(),
    constitution: z.number().optional(),
    intelligence: z.number().optional(),
    wisdom: z.number().optional(),
    charisma: z.number().optional(),
});

export const SkillSchema = z.object({
    athletics: z.number().optional(),
    acrobatics: z.number().optional(),
    sleightHand: z.number().optional(),
    stealth: z.number().optional(),
    arcana: z.number().optional(),
    history: z.number().optional(),
    investigation: z.number().optional(),
    nature: z.number().optional(),
    religion: z.number().optional(),
    animalHandling: z.number().optional(),
    insight: z.number().optional(),
    medicine: z.number().optional(),
    perception: z.number().optional(),
    survival: z.number().optional(),
    deception: z.number().optional(),
    intimidation: z.number().optional(),
    performance: z.number().optional(),
    persuasion: z.number().optional(),
});

export const SenseSchema = z.object({
    name: z.string().optional(),
    value: z.number().optional(),
});

// ===== Stats =====
export const StatsSchema = z.object({
    size: z.string().default('Medium'), // REQUIRED dans Mongoose
    maxHitPoints: z.number().optional(),
    currentHitPoints: z.number().optional(),
    tempHitPoints: z.number().optional(),
    armorClass: z.number().optional(),
    initiative: z.number().optional(),
    speed: SpeedSchema.optional(),
    abilityScores: AbilityScoresSchema.optional(),
    languages: z.array(z.string()).optional(),
    passivePerception: z.number().optional(),
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
export const SpellSchema = z.object({
    name: z.string().optional(),
    level: z.number().optional(),
    school: z.string().optional(),
    description: z.string().optional(),
    components: z.array(z.string()).optional(),
    castingTime: z.string().optional(),
    duration: z.string().optional(),
    range: z.string().optional(),
    effectType: z.enum(['attack', 'heal', 'utility']).optional(),
    damage: z.string().optional(),
    healing: z.string().optional(),
});

export const SpellSlotSchema = z.object({
    total: z.number().optional(),
    used: z.number().optional(),
});

export const SpellcastingSchema = z.object({
    className: z.string().optional(),
    ability: z.string().optional(),
    saveDC: z.number().optional(),
    attackBonus: z.number().optional(),
    spellSlotsByLevel: z.record(z.string(), SpellSlotSchema).optional(),
    totalSlots: z.number().optional(),
    spells: z.array(SpellSchema).optional(),
});

// ===== Appearance =====
export const AppearanceSchema = z.object({
    age: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    weight: z.number().min(0).optional(),
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
    cp: z.number().min(0).optional(),
    sp: z.number().min(0).optional(),
    ep: z.number().min(0).optional(),
    gp: z.number().min(0).optional(),
    pp: z.number().min(0).optional(),
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
    type: z.string().optional(),
});

export const DifficultyClassSchema = z.object({
    dcType: z.string().optional(),
    dcValue: z.number().int().min(0).optional(),
    successType: z.string().optional(),
});

export function ActionSchema(zm: ZodMessages) {
    return z.object({
        name: z.string({ message: zm.required() }).min(1, { message: zm.minString(1) }).optional(),
        type: z.string().optional(),
        description: z.string().optional(),
        attackBonus: z.number().optional(),
        damage: z.array(DamageSchema).optional(),
        range: z.string().optional(),
        dc: DifficultyClassSchema.optional().nullable(),
        cost: z.number().optional(),
    })
};
