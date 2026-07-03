/**
 * @see FR-session-gm-codex-library: In-Session GM Community Library Access
 */
export function shouldShowSessionCommunityLibraryButton(
  isInSession: boolean,
  isGameMaster: boolean,
): boolean {
  return isInSession && isGameMaster;
}
