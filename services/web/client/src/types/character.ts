export interface Stats {
    level: number;
    experiencePoints: number;
    hitPoints: {
        current: number;
        max: number;
        temporary: number;
    };
    armorClass: number;
    initiative: number;
    speed: number;
    proficiencyBonus: number;
    passivePerception: number;
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

export interface Spellcasting {
    name: string;
    level: number;
    description: string;
}

export interface Appearance {
    age: number;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
}

export interface Background {
    backstory: string;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
}

export interface Treasure {
    gold: number;
    items: string[];
}

export interface Conditions {
    status: string[];
}

export interface Character {
    _id: string;
    name: string;
    stats: Stats;
    affinities: Affinities;
    abilities: Ability[];
    spellcasting: Spellcasting[];
    appearance: Appearance;
    background: Background;
    treasure: Treasure;
    conditions: Conditions;
    groups: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
