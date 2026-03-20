const DND_CR_FRACTIONS: Array<{ decimal: number; fraction: string }> = [
    { decimal: 0.125, fraction: "1/8" },
    { decimal: 0.25, fraction: "1/4" },
    { decimal: 0.5, fraction: "1/2" },
];

const EPSILON = 0.000001;

function isCloseTo(value: number, target: number): boolean {
    return Math.abs(value - target) < EPSILON;
}

export function normalizeChallengeRating(value: number): number {
    if (!Number.isFinite(value) || value < 0) return 0;

    const matchedFraction = DND_CR_FRACTIONS.find(({ decimal }) => isCloseTo(value, decimal));
    if (matchedFraction) {
        return matchedFraction.decimal;
    }

    return value;
}

export function formatChallengeRating(value?: number | null): string {
    if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
        return "0";
    }

    const normalized = normalizeChallengeRating(value);
    const matchedFraction = DND_CR_FRACTIONS.find(({ decimal }) => isCloseTo(normalized, decimal));

    if (matchedFraction) {
        return matchedFraction.fraction;
    }

    if (Number.isInteger(normalized)) {
        return String(normalized);
    }

    return String(normalized);
}

export function parseChallengeRatingInput(input: string): number {
    const normalizedInput = input.trim().replace(",", ".");

    if (normalizedInput === "") {
        return 0;
    }

    if (normalizedInput.includes("/")) {
        const [numeratorRaw, denominatorRaw] = normalizedInput.split("/");
        const numerator = Number(numeratorRaw);
        const denominator = Number(denominatorRaw);

        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
            return NaN;
        }

        return normalizeChallengeRating(numerator / denominator);
    }

    const parsed = Number(normalizedInput);
    if (!Number.isFinite(parsed)) {
        return NaN;
    }

    return normalizeChallengeRating(parsed);
}
