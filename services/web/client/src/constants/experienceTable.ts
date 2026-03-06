/**
 * Table d'expérience officielle de D&D 5e
 * Associe chaque niveau (1 à 20) à l'expérience minimale requise
 * 
 * Source: Player's Handbook D&D 5e
 */
export const EXPERIENCE_TABLE: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000,
};

/**
 * XP maximum pour le niveau 20 (au-delà, on reste niveau 20)
 */
export const MAX_LEVEL = 20;
export const MIN_LEVEL = 1;
