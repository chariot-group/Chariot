export interface AbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

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

export interface Stats {
    size: string;
    maxHitPoints: number;
    currentHitPoints: number;
    tempHitPoints: number;
    armorClass: number;
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
    effectType: 'attack' | 'heal' | 'utility';
    damage?: string;
    healing?: string;
}

export interface Spellcasting {
    ability: string;
    saveDC: number;
    attackBonus: number;
    spellSlotsByLevel: Record<string, { total: number; used: number }>;
    totalSlots: number;
    spells: Spell[];
}

export interface Appearance {
    age: number;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
}

export interface Background {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    alliesAndOrgs: string;
    backstory: string;
}

export interface Treasure {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
    notes: string;
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
    name: string;
    subclass: string;
    level: number;
    hitDice: number;
}

export interface Progression {
    level: number;
    experience: number;
}

export interface PlayerProfile {
    alignment: string;
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
    inspiration: boolean;
    progression: Progression;
    class: Class[];
    profile: PlayerProfile;
    exhaustionLevel: number;
}

export interface Damage {
    dice: string;
    type: string;
}

export interface Action {
    name: string;
    type: string;
    attackBonus: number;
    damage: Damage;
    range: string;
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
    alignment: string;
    type: string;
    subtype: string;
}

export interface NPC extends Character {
    actions: Actions;
    challenge: Challenge;
    profile: NPCProfile;
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

