import axios from "axios";

/**
 * True when the API denies access or the resource is missing (do not retry / do not post-login there).
 */
export function isCharacterAccessDeniedError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 403 || status === 404;
}
