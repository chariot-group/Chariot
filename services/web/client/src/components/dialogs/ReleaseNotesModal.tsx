"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ALL_RELEASE_NOTES, CURRENT_APP_VERSION } from "@/data/release-notes";
import type { ReleaseNote, SupportedLocale } from "@/data/release-notes";

interface ReleaseNotesModalProps {
  open: boolean;
  onClose: () => void;
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return value === "fr" || value === "en" || value === "es";
}

function formatDate(isoDate: string, locale: SupportedLocale): string {
  return new Date(isoDate).toLocaleDateString(
    locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );
}

function VersionSidebar({
  notes,
  selectedVersion,
  locale,
  onSelect,
}: {
  notes: ReleaseNote[];
  selectedVersion: string;
  locale: SupportedLocale;
  onSelect: (v: string) => void;
}) {
  return (
    <aside
      className="w-[148px] lg:w-[180px] shrink-0 border-r border-white/8 overflow-y-auto cursor-default
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-white/20
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:cursor-pointer"
      aria-label="Versions"
    >
      {notes.map((note) => {
        const isActive = note.version === selectedVersion;
        return (
          <button
            key={note.version}
            onClick={() => onSelect(note.version)}
            className={`w-full text-left px-4 py-3 lg:px-5 lg:py-4 border-l-[3px] transition-colors cursor-pointer ${
              isActive
                ? "border-l-accent bg-white/[0.05] text-white/90"
                : "border-l-transparent text-white/35 hover:text-white/65 hover:bg-white/[0.03]"
            }`}
          >
            <span className="block text-xs lg:text-sm font-medium leading-none mb-1 lg:mb-1.5">
              {note.version}
            </span>
            <span className="block text-[11px] lg:text-xs leading-none text-white/30">
              {formatDate(note.date, locale)}
            </span>
          </button>
        );
      })}
    </aside>
  );
}

function ReleaseNoteContent({
  note,
  locale,
  isLatest,
  t,
}: {
  note: ReleaseNote;
  locale: SupportedLocale;
  isLatest: boolean;
  t: ReturnType<typeof useTranslations<"releaseNotes">>;
}) {
  const translation = note.translations[locale];
  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-4 lg:px-8 lg:pt-7 lg:pb-5 border-b border-white/8 shrink-0">
        <h2 className="text-[15px] lg:text-xl font-medium text-white/90 leading-snug lg:leading-snug">
          {translation.title}
        </h2>
        <div className="mt-1.5 lg:mt-2.5 flex items-center gap-2 lg:gap-2.5">
          <p className="text-[11px] lg:text-sm text-white/30">
            {formatDate(note.date, locale)}
          </p>
          {isLatest && (
            <span className="inline-flex items-center gap-1.5 text-[11px] lg:text-xs text-accent bg-accent/10 border border-accent/25 rounded-full px-2 py-0.5 lg:px-2.5 lg:py-1 leading-none">
              <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-accent" aria-hidden="true" />
              {t("latest")}
            </span>
          )}
        </div>
      </div>

      <div
        className="overflow-y-auto px-5 py-4 lg:px-8 lg:py-6 min-h-0 max-h-[min(55dvh,420px)] lg:max-h-[min(60dvh,520px)]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/15
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <ul className="flex flex-col gap-2.5 lg:gap-4" aria-label={translation.title}>
          {translation.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2.5 lg:gap-3.5">
              <svg
                className="mt-0.5 lg:mt-1 shrink-0 text-accent/70 size-3 lg:size-4"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 6h7M6.5 3.5 9 6l-2.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13px] lg:text-base text-white/60 leading-relaxed lg:leading-relaxed">
                {highlight.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReleaseNotesModal({ open, onClose }: ReleaseNotesModalProps) {
  const t = useTranslations("releaseNotes");
  const pathname = usePathname();
  const rawLocale = pathname.split("/")[1] || "fr";
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : "fr";

  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_APP_VERSION);

  const currentNote = ALL_RELEASE_NOTES.find((n) => n.version === selectedVersion) ?? ALL_RELEASE_NOTES[0];
  const isLatest = currentNote?.version === CURRENT_APP_VERSION;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        className="sm:max-w-[580px] lg:max-w-3xl xl:max-w-4xl max-h-[min(90dvh,720px)] flex flex-col gap-0 p-0 overflow-hidden"
        aria-describedby="release-notes-description"
      >
        <VisuallyHidden>
          <DialogTitle>{t("title")}</DialogTitle>
        </VisuallyHidden>
        <div className="flex min-h-0">
          <VersionSidebar
            notes={ALL_RELEASE_NOTES}
            selectedVersion={currentNote?.version ?? CURRENT_APP_VERSION}
            locale={locale}
            onSelect={setSelectedVersion}
          />

          <div id="release-notes-description" className="flex-1 flex flex-col min-w-0">
            {currentNote && (
              <ReleaseNoteContent
                note={currentNote}
                locale={locale}
                isLatest={isLatest}
                t={t}
              />
            )}
          </div>
        </div>

        <div className="px-5 py-3 lg:px-8 lg:py-4 shrink-0 flex justify-end border-t border-white/8">
          <Button onClick={onClose} className="rounded-[15px] text-sm lg:text-base h-8 lg:h-10 lg:px-6">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
