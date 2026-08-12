import { describe, expect, it } from "vitest";
import axios, { AxiosError } from "axios";
import { isCharacterAccessDeniedError } from "@/lib/characterAccessError";

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
