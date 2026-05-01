export interface AbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

// Enums from backend
export type Alignment =
    | 'Lawful Good'
    | 'Neutral Good'
    | 'Chaotic Good'
    | 'Lawful Neutral'
    | 'True Neutral'
    | 'Chaotic Neutral'
    | 'Lawful Evil'
    | 'Neutral Evil'
    | 'Chaotic Evil'
    | 'Unaligned'
    | 'Any Good Alignment'
    | 'Any Evil Alignment'
    | 'Any Lawful Alignment'
    | 'Any Chaotic Alignment';

export type ClassName =
    | 'Artificer'
    | 'Barbarian'
    | 'Bard'
    | 'Cleric'
    | 'Druid'
    | 'Fighter'
    | 'Monk'
    | 'Paladin'
    | 'Ranger'
    | 'Rogue'
    | 'Sorcerer'
    | 'Warlock'
    | 'Wizard';

export interface Speed {
    walk: number;
    climb: number;
    swim: number;
    fly: number;
    burrow: number;
}

export interface Skills {
    athletics: number;
    acrobatics: number;
    sleightHand: number;
    stealth: number;
    arcana: number;
    history: number;
    investigation: number;
    nature: number;
    religion: number;
    animalHandling: number;
    insight: number;
    medicine: number;
    perception: number;
    survival: number;
    deception: number;
    intimidation: number;
    performance: number;
    persuasion: number;
}

export interface Sense {
    name: string;
    value: number;
}

export interface SavingThrows {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface DeathSaves {
    successes: number;
    failures: number;
}

export interface Stats {
    size: string;
    maxHitPoints: number;
    currentHitPoints: number;
    tempHitPoints: number;
    armorClass: number;
    initiative: number;
    speed: Speed;
    abilityScores: AbilityScores;
    languages: string[];
    passivePerception: number;
    savingThrows: SavingThrows;
    skills: Skills;
    senses: Sense[];
}

export interface PlayerStats extends Stats {
    proficiencyBonus: number;
    armors: string[];
    weapons: string[];
    tools: string[];
    masteries: {
        athletics: number;
        acrobatics: number;
        sleightHand: number;
        stealth: number;
        arcana: number;
        history: number;
        investigation: number;
        nature: number;
        religion: number;
        animalHandling: number;
        insight: number;
        medicine: number;
        perception: number;
        survival: number;
        deception: number;
        intimidation: number;
        performance: number;
        persuasion: number;
    };
    masteriesAbility: {
        strength: boolean;
        dexterity: boolean;
        constitution: boolean;
        intelligence: boolean;
        wisdom: boolean;
        charisma: boolean;
    };
}

export interface Affinities {
    resistances: string[];
    immunities: string[];
    vulnerabilities: string[];
}

export interface Ability {
    name: string;
    description: string;
    /** Compteur d'utilisations — absent ou false : données héritées inchangées */
    hasCounter?: boolean;
    /** Plafond d'utilisations (inclus) lorsque le compteur est actif */
    counterMax?: number;
    /** Utilisations consommées ; défaut 0 */
    counterCurrent?: number;
    /** Réinitialisation du compteur après un repos court (métadonnée) */
    counterResetsOnShortRest?: boolean;
    /** Réinitialisation du compteur après un repos long (métadonnée) */
    counterResetsOnLongRest?: boolean;
}

export interface DamageDetails {
    diceCount: number | null;
    diceType: string | null;
    bonus: number | null;
    damageType: string | null;
}

export interface HealingDetails {
    diceCount: number | null;
    diceType: string | null;
    bonus: number | null;
}

export interface Spell {
    name: string;
    level: number;
    school: string;
    description: string;
    components: string[];
    castingTime: string;
    duration: string;
    range: string;
    classes?: string[];
    effectType: 'attack' | 'heal' | 'utility';
    damage?: string;
    healing?: string;
    damageDetails?: DamageDetails;
    healingDetails?: HealingDetails;
    /** NPC only — number of times this spell can be cast per day (undefined = at will) */
    usesPerDay?: number | null;
    /** NPC only — number of times this spell has been cast today */
    used?: number;
    /**
     * PJ, classes à sorts préparés (niveau ≥ 1) : uniquement `prepared === true` compte comme préparé et permet le lancement.
     * `false` ou absent = non préparé.
     */
    prepared?: boolean;
}

export interface Spellcasting {
    className: string;
    ability: string;
    saveDC: number;
    attackBonus: number;
    spellSlotsByLevel: Record<string, { total: number; used: number }>;
    /** NPC only — tracker of uses per day keyed by usesPerDay value (e.g. "2" → {used: 0, total: 2}) */
    spellSlotsByUses?: Record<string, number | null>;
    totalSlots: number;
    /** Whether spells are innate (grouped by uses per day). false = by level (default), true = innate/by uses */
    isInnate?: boolean;
    spells: Spell[];
}

export interface Appearance {
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    eyes?: string | null;
    skin?: string | null;
    hair?: string | null;
    description?: string | null;
}

export interface Background {
    personalityTraits?: string | null;
    ideals?: string | null;
    bonds?: string | null;
    flaws?: string | null;
    alliesAndOrgs?: string | null;
    backstory?: string | null;
}

export interface Treasure {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
    treasure: string;
    equipment: string;
}

export interface Conditions {
    blinded: boolean;
    charmed: boolean;
    deafened: boolean;
    frightened: boolean;
    grappled: boolean;
    incapacitated: boolean;
    invisible: boolean;
    paralyzed: boolean;
    petrified: boolean;
    poisoned: boolean;
    prone: boolean;
    restrained: boolean;
    stunned: boolean;
    unconscious: boolean;
}

export interface Class {
    name: ClassName;
    subclass: string;
    level: number;
    hitDice: number;
    /** Dés de vie restants pour cette classe ; absent = égal au niveau en entrée de jeu */
    hitDiceRemaining?: number;
}

export interface Progression {
    level: number;
    experience: number;
}

export interface PlayerProfile {
    alignment: Alignment;
    race: string;
    subrace: string;
    history: string;
}

export interface Group {
    _id: string;
    label: string;
    characters: string[];
    campaigns: string[];
    deletedAt?: string | null;
}

export interface Character {
    _id: string;
    firstname: string;
    lastname: string;
    surname: string;
    avatar: string;
    stats: Stats;
    affinities: Affinities;
    abilities: Ability[];
    spellcasting: Spellcasting[];
    appearance: Appearance;
    background: Background;
    treasure: Treasure;
    conditions: Conditions;
    groups: Group[];
    deletedAt?: string | null;
}

export interface Player extends Character {
    stats: PlayerStats;
    actions: Action[];
    inspiration: boolean;
    progression: Progression;
    class: Class[];
    profile: PlayerProfile;
    exhaustionLevel: number;
    deathSaves: DeathSaves;
}

export interface Damage {
    dice: string;
    type: string;
    applyAbilityBonus?: boolean;
}

export interface DifficultyClass {
    dcType?: string;
    dcValue?: number;
    successType?: string;
}

export type ActionUsageType = "action" | "bonus_action" | "reaction";

export interface Action {
    name: string;
    type: string;
    usageType?: ActionUsageType;
    attackAbility?: keyof AbilityScores;
    description?: string;
    attackBonus: number;
    damage?: Damage[];
    range: string;
    dc?: DifficultyClass;
    cost?: number;
}

export interface Actions {
    standard: Action[];
    legendary: Action[];
    lair: Action[];
}

export interface Challenge {
    challengeRating: number;
    experiencePoints: number;
}

export interface NPCProfile {
    alignment: Alignment;
    type: string;
    subtype: string;
}

export interface NPC extends Character {
    actions: Actions;
    challenge: Challenge;
    profile: NPCProfile;
    hitPointsRoll?: string;
}

export interface PaginatedCharactersResponse {
    message: string;
    data: Character[];
    pagination: {
        page: number;
        offset: number;
        totalItems: number;
    };
}

