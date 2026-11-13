import { describe, expect, it, vi } from "vitest";
import { applyGroupLongRest, type GroupLongRestDeps } from "@/lib/groupLongRest";
import type { NPC, Player } from "@/types/character";

const GM = "gm-1";

function character(id: string, kind: "pc" | "npc", createdBy: string): Player | NPC {
    return {
        _id: id,
        createdBy,
        stats: { currentHitPoints: 1, maxHitPoints: 10, tempHitPoints: 0 },
        abilities: [],
        spellcasting: [],
        ...(kind === "pc" ? { progression: {}, exhaustionLevel: 0, class: [] } : { challenge: {} }),
    } as unknown as Player | NPC;
}

function makeDeps(db: Record<string, Player | NPC>, failIds: string[] = []) {
    const updateCharacter = vi.fn<GroupLongRestDeps["updateCharacter"]>(async (_type, id, data) => {
        if (failIds.includes(id)) throw new Error("403");
        return { ...db[id], ...data } as Player | NPC;
    });
    const fetchCharacter = vi.fn<GroupLongRestDeps["fetchCharacter"]>(async (id) => db[id]);
    return { deps: { fetchCharacter, updateCharacter }, updateCharacter, fetchCharacter };
}

/** @see FR-character-long-rest */
describe("FR-character-long-rest — group long rest", () => {
    it("nominal: rests every GM character of the group out of session (PCs and NPCs)", async () => {
        const db = { a: character("a", "pc", GM), b: character("b", "pc", GM), c: character("c", "npc", GM) };
        const { deps, updateCharacter } = makeDeps(db);
        const result = await applyGroupLongRest({ characterIds: ["a", "b", "c"], currentUserId: GM, sessionCode: null }, deps);
        expect(result.rested.map((r) => r._id)).toEqual(["a", "b", "c"]);
        expect(result.skipped).toBe(0);
        expect(updateCharacter).toHaveBeenCalledWith("players", "a", expect.objectContaining({ exhaustionLevel: 0 }), null);
        expect(updateCharacter).toHaveBeenCalledWith("npcs", "c", expect.not.objectContaining({ exhaustionLevel: 0 }), null);
        expect(result.rested[0].stats.currentHitPoints).toBe(10);
    });

    it("failure: out of session a player-space PC is skipped without any update", async () => {
        const db = { a: character("a", "pc", GM), p: character("p", "pc", "player-1") };
        const { deps, updateCharacter } = makeDeps(db);
        const result = await applyGroupLongRest({ characterIds: ["a", "p"], currentUserId: GM, sessionCode: " " }, deps);
        expect(result.skipped).toBe(1);
        expect(updateCharacter).not.toHaveBeenCalledWith(expect.anything(), "p", expect.anything(), expect.anything());
    });

    it("edge: in session a session-authorized player PC is rested through the session code", async () => {
        const db = { p: character("p", "pc", "player-1") };
        const { deps, updateCharacter, fetchCharacter } = makeDeps(db);
        const result = await applyGroupLongRest({ characterIds: ["p"], currentUserId: GM, sessionCode: "ABC123" }, deps);
        expect(fetchCharacter).toHaveBeenCalledWith("p", "ABC123");
        expect(updateCharacter).toHaveBeenCalledWith("players", "p", expect.anything(), "ABC123");
        expect(result.rested).toHaveLength(1);
    });

    it("failure: one rejected update does not abort the others and is counted as skipped", async () => {
        const db = { a: character("a", "pc", GM), b: character("b", "npc", GM) };
        const { deps } = makeDeps(db, ["a"]);
        const result = await applyGroupLongRest({ characterIds: ["a", "b"], currentUserId: GM, sessionCode: null }, deps);
        expect(result.rested.map((r) => r._id)).toEqual(["b"]);
        expect(result.skipped).toBe(1);
    });

    it("edge (race): a character listed twice is rested once", async () => {
        const db = { a: character("a", "npc", GM) };
        const { deps, updateCharacter } = makeDeps(db);
        const result = await applyGroupLongRest({ characterIds: ["a", "a", ""], currentUserId: GM, sessionCode: null }, deps);
        expect(updateCharacter).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({ skipped: 0 });
    });
});
