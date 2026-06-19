export type SupportedLocale = 'fr' | 'en' | 'es';

export interface ReleaseNoteHighlight {
  text: string;
}

export interface ReleaseNoteTranslation {
  title: string;
  highlights: ReleaseNoteHighlight[];
}

export interface ReleaseNote {
  version: string;
  date: string;
  translations: Record<SupportedLocale, ReleaseNoteTranslation>;
}
