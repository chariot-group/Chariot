/**
 * Formate un nombre en version compacte avec arrondi à l'inférieur (1281 -> 1.2k, 1500000 -> 1.5M)
 * @param value - Le nombre à formater
 * @returns Le nombre formaté en chaîne de caractères
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1000000) {
        const millions = Math.floor(value / 100000) / 10; // Arrondi à l'inférieur avec 1 décimale
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    }
    if (value >= 1000) {
        const thousands = Math.floor(value / 100) / 10; // Arrondi à l'inférieur avec 1 décimale
        return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
    }
    return value.toString();
};

/**
 * Formate un nombre avec des espaces pour les milliers (10000 -> 10 000)
 * @param value - Le nombre à formater
 * @returns Le nombre formaté avec des espaces
 */
export function formatNumberWithSpaces(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};