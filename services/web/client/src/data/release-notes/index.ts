export type { ReleaseNote, ReleaseNoteHighlight, ReleaseNoteTranslation, SupportedLocale } from '@/data/release-notes/types';
export { ALL_RELEASE_NOTES } from '@/data/release-notes/versions';
import { ALL_RELEASE_NOTES } from '@/data/release-notes/versions';

export { CURRENT_APP_VERSION } from '@/data/release-notes/currentVersion';

export function getReleaseNoteByVersion(version: string) {
  return ALL_RELEASE_NOTES.find((n) => n.version === version);
}
