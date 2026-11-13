import { describe, expect, it } from "vitest";
import type { Class, NPC, Player } from "@/types/character";
import {
    buildCharacterLongRestUpdatePayload,
    buildLongRestUpdatePayload,
    buildBaseLongRestUpdatePayload,
    canUseLongRest,
    getLongRestEffects,
    sumShortRestHitDicePreview,
} from "@/utils/rest.utils";

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

/** @see FR-character-long-rest */
describe("FR-character-long-rest — payloads, effects and availability", () => {
    const usedAbility = { name: "Souffle", hasCounter: true, counterMax: 1, counterCurrent: 1, counterResetsOnLongRest: true };
    const shortOnlyAbility = { name: "Second souffle", hasCounter: true, counterMax: 1, counterCurrent: 1, counterResetsOnShortRest: true };
    const spellcasting = {
        className: "wizard",
        spellSlotsByLevel: { "1": { max: 4, used: 3 } },
        spellSlotsByUses: { "3": 2 },
        spells: [{ name: "Charme", usesPerDay: 1, used: 1 }],
    };
    const npc = {
        _id: "npc-1",
        stats: { currentHitPoints: 3, maxHitPoints: 20, tempHitPoints: 5, armorClass: 12 },
        abilities: [usedAbility, shortOnlyAbility],
        spellcasting: [spellcasting],
        challenge: { challengeRating: 1, experiencePoints: 200 },
    } as unknown as NPC;
    const player = {
        ...npc,
        _id: "pc-1",
        progression: {},
        exhaustionLevel: 2,
        class: [{ name: "fighter", level: 3, hitDice: 10, hitDiceRemaining: 1 }],
    } as unknown as Player;

    it("nominal: NPC payload restores HP, clears temp HP, resets long-rest counters and spell resources", () => {
        const payload = buildBaseLongRestUpdatePayload(npc);
        expect(payload.stats.currentHitPoints).toBe(20);
        expect(payload.stats.tempHitPoints).toBe(0);
        expect(payload.stats.armorClass).toBe(12);
        expect(payload.abilities[0].counterCurrent).toBe(0);
        expect(payload.spellcasting[0].spellSlotsByLevel?.["1"]).toEqual({ max: 4, used: 0 });
        expect(payload.spellcasting[0].spellSlotsByUses).toEqual({ "3": 0 });
        expect(payload.spellcasting[0].spells?.[0].used).toBe(0);
        expect(payload).not.toHaveProperty("exhaustionLevel");
        expect(payload).not.toHaveProperty("class");
    });

    it("edge: a short-rest-only counter is not reset by the long rest payload", () => {
        expect(buildBaseLongRestUpdatePayload(npc).abilities[1].counterCurrent).toBe(1);
    });

    it("nominal: PC payload also lowers exhaustion and restores hit dice", () => {
        const payload = buildLongRestUpdatePayload(player);
        expect(payload.exhaustionLevel).toBe(1);
        expect(payload.class[0].hitDiceRemaining).toBe(3);
        expect(payload.stats.currentHitPoints).toBe(20);
        expect(buildCharacterLongRestUpdatePayload(player)).toHaveProperty("exhaustionLevel", 1);
        expect(buildCharacterLongRestUpdatePayload(npc)).not.toHaveProperty("exhaustionLevel");
    });

    it("edge: effects list only what changes; nothing to recover gives an empty list", () => {
        expect(getLongRestEffects(npc)).toEqual(["spell-slots", "abilities", "hp", "temp-hp"]);
        expect(getLongRestEffects(player)).toEqual(["spell-slots", "abilities", "hit-dice", "hp", "temp-hp", "exhaustion"]);
        const rested = { ...npc, ...buildBaseLongRestUpdatePayload(npc) } as NPC;
        expect(getLongRestEffects(rested)).toEqual([]);
    });

    it("nominal: GM space allows the long rest out of session for own PC and NPC", () => {
        const base = { isSessionLaunched: false, isPlayerSpace: false, isOwnCharacter: true };
        expect(canUseLongRest({ ...base, isPlayerCharacter: true })).toBe(true);
        expect(canUseLongRest({ ...base, isPlayerCharacter: false })).toBe(true);
    });

    it("nominal: in session the long rest stays available as before", () => {
        expect(
            canUseLongRest({ isPlayerCharacter: true, isSessionLaunched: true, isPlayerSpace: true, isOwnCharacter: true }),
        ).toBe(true);
    });

    it("failure: player space never rests out of session, and foreign characters are refused", () => {
        expect(
            canUseLongRest({ isPlayerCharacter: true, isSessionLaunched: false, isPlayerSpace: true, isOwnCharacter: true }),
        ).toBe(false);
        expect(
            canUseLongRest({ isPlayerCharacter: true, isSessionLaunched: false, isPlayerSpace: false, isOwnCharacter: false }),
        ).toBe(false);
        expect(
            canUseLongRest({ isPlayerCharacter: false, isSessionLaunched: true, isPlayerSpace: true, isOwnCharacter: true }),
        ).toBe(false);
    });
});
