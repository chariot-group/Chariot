import { describe, expect, it } from "vitest";
import type { Class } from "@/types/character";
import { sumShortRestHitDicePreview } from "@/utils/rest.utils";

const fighter = { name: "fighter", level: 3, hitDice: 10 } as unknown as Class;
const wizard = { name: "wizard", level: 2, hitDice: 6 } as unknown as Class;

describe("sumShortRestHitDicePreview", () => {
    it("returns 0 when no die has been added", () => {
        expect(sumShortRestHitDicePreview([], [fighter])).toBe(0);
    });

    it("sums valid values across classes", () => {
        const rows = [
            { classIndex: 0, value: "7" },
            { classIndex: 1, value: " 4 " },
        ];
        expect(sumShortRestHitDicePreview(rows, [fighter, wizard])).toBe(11);
    });

    it("counts empty or out-of-range values as 0", () => {
        const rows = [
            { classIndex: 0, value: "" },
            { classIndex: 1, value: "9" },
            { classIndex: 0, value: "5" },
        ];
        expect(sumShortRestHitDicePreview(rows, [fighter, wizard])).toBe(5);
    });

    it("ignores rows pointing to an unknown class", () => {
        expect(sumShortRestHitDicePreview([{ classIndex: 3, value: "4" }], [fighter])).toBe(0);
    });
});
