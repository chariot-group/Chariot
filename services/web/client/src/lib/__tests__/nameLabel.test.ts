import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import {
  getNameLabelLength,
  isNameLabelTooLong,
  isNameLabelValid,
  isNameLabelValidationError,
  NAME_LABEL_MAX_LENGTH,
} from "@/lib/nameLabel";

const axiosError = (status: number, data?: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

/** @see FR-form-field-validation (Group and campaign names) */
describe("FR-form-field-validation — name label length", () => {
  it("nominal: a 50-character name is valid", () => {
    const name = "a".repeat(NAME_LABEL_MAX_LENGTH);
    expect(isNameLabelValid(name)).toBe(true);
    expect(isNameLabelTooLong(name)).toBe(false);
  });

  it("edge: a 51-character name is too long and invalid", () => {
    const name = "a".repeat(NAME_LABEL_MAX_LENGTH + 1);
    expect(isNameLabelTooLong(name)).toBe(true);
    expect(isNameLabelValid(name)).toBe(false);
  });

  it("edge: the length is measured after trimming", () => {
    const padded = `   ${"a".repeat(NAME_LABEL_MAX_LENGTH)}   `;
    expect(getNameLabelLength(padded)).toBe(NAME_LABEL_MAX_LENGTH);
    expect(isNameLabelValid(padded)).toBe(true);
  });

  it("failure: an empty or blank name is invalid", () => {
    expect(isNameLabelValid("")).toBe(false);
    expect(isNameLabelValid("   ")).toBe(false);
  });
});

describe("FR-form-field-validation — isNameLabelValidationError", () => {
  it("nominal: a 400 with an invalid `label` param is a name validation error", () => {
    const error = axiosError(400, {
      status: 400,
      detail: "Validation failed",
      "invalid-params": [{ name: "label", reason: "must be shorter than or equal to 50 characters" }],
    });
    expect(isNameLabelValidationError(error)).toBe(true);
  });

  it("edge: a 400 on another field is not a name validation error", () => {
    const error = axiosError(400, { "invalid-params": [{ name: "groups", reason: "should not be empty" }] });
    expect(isNameLabelValidationError(error)).toBe(false);
  });

  it("failure: 5xx, network and non-axios errors keep the generic toast", () => {
    expect(isNameLabelValidationError(axiosError(500, { detail: "boom" }))).toBe(false);
    expect(isNameLabelValidationError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(false);
    expect(isNameLabelValidationError(new Error("boom"))).toBe(false);
    expect(isNameLabelValidationError(axiosError(400, undefined))).toBe(false);
  });
});
