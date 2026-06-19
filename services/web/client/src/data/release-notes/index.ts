export type { ReleaseNote, ReleaseNoteHighlight, ReleaseNoteTranslation, SupportedLocale } from '@/data/release-notes/types';
export { ALL_RELEASE_NOTES } from '@/data/release-notes/versions';
import { ALL_RELEASE_NOTES } from '@/data/release-notes/versions';

/**
 * Current application version — driven by NEXT_PUBLIC_APP_VERSION (same variable shown in the sidebar footer).
 * Bump that env var alongside package.json on each release; no code change needed here.
 */
export const CURRENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

export function getReleaseNoteByVersion(version: string) {
  return ALL_RELEASE_NOTES.find((n) => n.version === version);
}
