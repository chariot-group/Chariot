"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
      className="w-[148px] shrink-0 border-r border-white/8 overflow-y-auto cursor-default
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
            className={`w-full text-left px-4 py-3 border-l-[3px] transition-colors cursor-pointer ${
              isActive
                ? "border-l-accent bg-white/[0.05] text-white/90"
                : "border-l-transparent text-white/35 hover:text-white/65 hover:bg-white/[0.03]"
            }`}
          >
            <span className="block text-xs font-medium leading-none mb-1">
              {note.version}
            </span>
            <span className="block text-[11px] leading-none text-white/30">
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
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
        <h2 className="text-[15px] font-medium text-white/90 leading-snug">
          {translation.title}
        </h2>
        <div className="mt-1.5 flex items-center gap-2">
          <p className="text-[11px] text-white/30">
            {formatDate(note.date, locale)}
          </p>
          {isLatest && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-accent bg-accent/10 border border-accent/25 rounded-full px-2 py-0.5 leading-none">
              <span className="w-1 h-1 rounded-full bg-accent" aria-hidden="true" />
              {t("latest")}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-4 min-h-0
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/15
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <ul className="flex flex-col gap-2.5" aria-label={translation.title}>
          {translation.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <svg
                className="mt-1 shrink-0 text-accent/70"
                width="12"
                height="12"
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
              <span className="text-[13px] text-white/60 leading-relaxed">
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
        className="sm:max-w-[580px] h-[460px] flex flex-col gap-0 p-0 overflow-hidden"
        aria-describedby="release-notes-description"
      >
        <div className="flex flex-1 min-h-0">
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

        <div className="px-5 py-3 shrink-0 flex justify-end border-t border-white/8">
          <Button onClick={onClose} className="rounded-[15px] text-sm h-8">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
