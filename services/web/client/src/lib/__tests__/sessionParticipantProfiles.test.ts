import { describe, expect, it, vi } from "vitest";
import { fetchParticipantProfiles } from "@/lib/sessionParticipantProfiles";

const profile = (keycloakId: string, extra: Record<string, string> = {}) => ({
    keycloakId,
    firstName: "",
    lastName: "",
    username: "",
    avatar: "",
    ...extra,
});

describe("FR-session-participant-labels — fetchParticipantProfiles", () => {
    it("nominal: resolves label and avatar of a late joiner", async () => {
        const getUser = vi.fn().mockResolvedValue(profile("u2", { username: "Ami", avatar: "u2.png" }));
        const result = await fetchParticipantProfiles(["u2"], "CODE", getUser);
        expect(getUser).toHaveBeenCalledWith("u2", "CODE");
        expect(result).toEqual({ resolved: [{ userId: "u2", label: "Ami", avatar: "u2.png" }], failed: [] });
    });

    it("edge: UUID username falls back to full name, missing avatar becomes null", async () => {
        const getUser = vi.fn().mockResolvedValue(
            profile("u2", {
                username: "11111111-1111-4111-8111-111111111111",
                firstName: "Jo",
                lastName: "Doe",
            }),
        );
        const { resolved } = await fetchParticipantProfiles(["u2"], "CODE", getUser);
        expect(resolved).toEqual([{ userId: "u2", label: "Jo Doe", avatar: null }]);
    });

    it("failure: a failing fetch is reported for retry without blocking the others", async () => {
        const getUser = vi
            .fn()
            .mockRejectedValueOnce(new Error("503"))
            .mockResolvedValueOnce(profile("u3", { username: "Ok" }));
        const { resolved, failed } = await fetchParticipantProfiles(["u2", "u3"], "CODE", getUser);
        expect(failed).toEqual(["u2"]);
        expect(resolved.map((p) => p.userId)).toEqual(["u3"]);
    });

    it("race: retrying a previously failed id resolves it", async () => {
        const getUser = vi
            .fn()
            .mockRejectedValueOnce(new Error("503"))
            .mockResolvedValueOnce(profile("u2", { username: "Ami" }));
        const first = await fetchParticipantProfiles(["u2"], "CODE", getUser);
        const second = await fetchParticipantProfiles(first.failed, "CODE", getUser);
        expect(second.resolved[0]).toMatchObject({ userId: "u2", label: "Ami" });
        expect(second.failed).toEqual([]);
    });
});
