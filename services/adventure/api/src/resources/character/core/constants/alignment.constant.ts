export const ALIGNMENT = [
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
] as const;

export type Alignment = (typeof ALIGNMENT)[number];
