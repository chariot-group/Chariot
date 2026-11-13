import axios from "axios";

/**
 * FR-form-field-validation — max length of a group or campaign name (after trim).
 * Mirrors `NAME_LABEL_MAX_LENGTH` in the adventure API DTOs.
 */
export const NAME_LABEL_MAX_LENGTH = 50;

/** Length that the API will validate: the name is always sent trimmed. */
export function getNameLabelLength(value: string): number {
  return value.trim().length;
}

export function isNameLabelTooLong(value: string): boolean {
  return getNameLabelLength(value) > NAME_LABEL_MAX_LENGTH;
}

/** A name can be saved when it is 1..50 characters long after trimming. */
export function isNameLabelValid(value: string): boolean {
  const length = getNameLabelLength(value);
  return length > 0 && length <= NAME_LABEL_MAX_LENGTH;
}

type InvalidParam = { name?: unknown };

/**
 * True when the API rejected the request because of the `label` field (HTTP 400,
 * RFC 9457 `invalid-params` produced by the adventure ErrorDetailsFilter).
 * Network and 5xx errors return false and keep the generic toast.
 */
export function isNameLabelValidationError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return false;
  const params = (error.response.data as { "invalid-params"?: unknown } | undefined)?.["invalid-params"];
  if (!Array.isArray(params)) return false;
  return params.some((param: InvalidParam) => param?.name === "label");
}
