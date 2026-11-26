import { describe, expect, it } from "vitest";
import { buildNameCorrection, getAccountGateSteps, getInvalidNameFields } from "@/lib/accountGate";
import type { User } from "@/types/user";

// @see FR-user-profile-keycloak: Irregular account regularization
const baseUser: User = {
  keycloakId: "abc-123",
  email: "user@example.com",
  username: "adventurer",
  firstName: "Jean",
  lastName: "1",
  balance: 0,
  history: [],
};

describe("accountGate — getAccountGateSteps", () => {
  it("nominal: an irregular account gets the name step", () => {
    expect(getAccountGateSteps({ ...baseUser, accountStatus: { invalidFields: ["lastName"] } })).toEqual(["name"]);
  });

  it("edge: a regular account is not gated", () => {
    expect(getAccountGateSteps({ ...baseUser, accountStatus: { invalidFields: [] } })).toEqual([]);
  });

  it("failure: fails open without user or without status from the API", () => {
    expect(getAccountGateSteps(null)).toEqual([]);
    expect(getAccountGateSteps(undefined)).toEqual([]);
    expect(getAccountGateSteps(baseUser)).toEqual([]);
  });
});

describe("accountGate — getInvalidNameFields", () => {
  it("nominal: keeps form order whatever the API order", () => {
    expect(
      getInvalidNameFields({ ...baseUser, accountStatus: { invalidFields: ["lastName", "firstName"] } }),
    ).toEqual(["firstName", "lastName"]);
  });

  it("edge: no status means no field to correct", () => {
    expect(getInvalidNameFields(baseUser)).toEqual([]);
  });
});

describe("accountGate — buildNameCorrection", () => {
  it("nominal: sends only the corrected fields, cleaned", () => {
    expect(buildNameCorrection({ firstName: "Jean", lastName: "  Le   Goff " }, ["lastName"])).toEqual({
      lastName: "Le Goff",
    });
  });

  it("edge: converts the typographic apostrophe", () => {
    expect(buildNameCorrection({ lastName: "O’Neil" }, ["lastName"])).toEqual({ lastName: "O'Neil" });
  });

  it("failure: a missing value is sent empty so the API rejects it", () => {
    expect(buildNameCorrection({}, ["firstName"])).toEqual({ firstName: "" });
  });
});
