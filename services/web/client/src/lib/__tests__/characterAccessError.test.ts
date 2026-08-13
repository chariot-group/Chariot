import { describe, expect, it } from "vitest";
import axios, { AxiosError } from "axios";
import {
  isCharacterAccessDeniedError,
  shouldClearCharacterAccessDeniedOnSessionCodeChange,
  shouldRedirectAwayFromCharacterSheet,
} from "@/lib/characterAccessError";

/** @see FR-user-cache-isolation: User Cache Isolation and Session Transition */
describe("FR-user-cache-isolation — character access denied detection", () => {
  it("nominal: treats 403 as access denied", () => {
    const error = new AxiosError("Forbidden");
    error.response = { status: 403, data: {}, statusText: "Forbidden", headers: {}, config: {} as never };
    expect(isCharacterAccessDeniedError(error)).toBe(true);
  });

  it("edge: treats 404 as access denied", () => {
    const error = new AxiosError("Not Found");
    error.response = { status: 404, data: {}, statusText: "Not Found", headers: {}, config: {} as never };
    expect(isCharacterAccessDeniedError(error)).toBe(true);
  });

  it("failure: ignores non-HTTP and other status codes", () => {
    expect(isCharacterAccessDeniedError(new Error("boom"))).toBe(false);
    const error = new AxiosError("Server error");
    error.response = { status: 500, data: {}, statusText: "Error", headers: {}, config: {} as never };
    expect(isCharacterAccessDeniedError(error)).toBe(false);
    expect(axios.isAxiosError(error)).toBe(true);
  });
});

/** @see FR-session-combat-navigation — session context retry after combat sheet navigation */
describe("FR-session-combat-navigation — clear access denied when sessionCode appears", () => {
  it("nominal: clears when sessionCode appears after an empty context", () => {
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange(null, "ABCD12")).toBe(true);
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange(undefined, "ABCD12")).toBe(true);
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange("  ", "ABCD12")).toBe(true);
  });

  it("edge: does not clear when session context was already present", () => {
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange("ABCD12", "ABCD12")).toBe(false);
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange("ABCD12", "ZZZZ99")).toBe(false);
  });

  it("failure: does not clear when sessionCode is still missing", () => {
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange(null, null)).toBe(false);
    expect(shouldClearCharacterAccessDeniedOnSessionCodeChange(null, "  ")).toBe(false);
  });
});

describe("FR-user-cache-isolation — sheet redirect gate", () => {
  it("nominal: redirects only on definitive access denial", () => {
    expect(shouldRedirectAwayFromCharacterSheet(true)).toBe(true);
  });

  it("edge: keeps the sheet route on transient failures", () => {
    expect(shouldRedirectAwayFromCharacterSheet(false)).toBe(false);
  });
});
