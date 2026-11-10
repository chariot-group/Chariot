"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface VersionNavProps {
  notes: ReleaseNote[];
  selectedVersion: string;
  locale: SupportedLocale;
  onSelect: (v: string) => void;
  label: string;
}

export function resolveSelectedNote(notes: ReleaseNote[], version: string): ReleaseNote | undefined {
  return notes.find((n) => n.version === version) ?? notes[0];
}

export function VersionSelect({ notes, selectedVersion, locale, onSelect, label }: VersionNavProps) {
  return (
    <Select
      value={selectedVersion}
      onValueChange={onSelect}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className="data-[size=sm]:h-7 max-w-full gap-1 rounded-full bg-white/[0.05] px-2.5 py-0 text-[11px] text-white/60 shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="max-h-[min(50dvh,var(--radix-select-content-available-height))]">
        {notes.map((note) => (
          <SelectItem
            key={note.version}
            value={note.version}>
            {note.version} · {formatDate(note.date, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function VersionSidebar({ notes, selectedVersion, locale, onSelect, label }: VersionNavProps) {
  return (
    <nav
      className="hidden sm:block w-[148px] lg:w-[180px] shrink-0 border-r border-frame overflow-y-auto cursor-default
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:cursor-pointer"
      aria-label={label}
    >
      {notes.map((note) => {
        const isActive = note.version === selectedVersion;
        return (
          <button
            key={note.version}
            type="button"
            aria-current={isActive ? "true" : undefined}
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
    </nav>
  );
}

function ReleaseNoteContent({
  note,
  locale,
  isLatest,
  versionPicker,
  t,
}: {
  note: ReleaseNote;
  locale: SupportedLocale;
  isLatest: boolean;
  versionPicker: React.ReactNode;
  t: ReturnType<typeof useTranslations<"releaseNotes">>;
}) {
  const translation = note.translations[locale];
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="pl-5 pr-12 pt-5 pb-3 sm:pr-5 sm:pb-4 lg:px-8 lg:pt-7 lg:pb-5 border-b border-frame shrink-0">
        <h2 className="text-base sm:text-[15px] lg:text-xl font-medium text-white/90 leading-snug lg:leading-snug">
          {translation.title}
        </h2>
        <div className="mt-1.5 lg:mt-2.5 flex items-center gap-2 lg:gap-2.5">
          <div className="sm:hidden min-w-0">{versionPicker}</div>
          <p className="hidden sm:block text-[11px] lg:text-sm text-white/30">
            {formatDate(note.date, locale)}
          </p>
          {isLatest && (
            <span className="inline-flex items-center gap-1.5 text-[11px] lg:text-xs text-primary-light bg-accent/10 border border-accent/25 rounded-full px-2 py-0.5 lg:px-2.5 lg:py-1 leading-none">
              <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-accent" aria-hidden="true" />
              {t("latest")}
            </span>
          )}
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 lg:px-8 lg:py-6
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb
          [&::-webkit-scrollbar-thumb]:rounded-full">
        <ul className="flex flex-col gap-2.5 lg:gap-4" aria-label={translation.title}>
          {translation.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-2.5 lg:gap-3.5">
              <svg
                className="mt-0.5 lg:mt-1 shrink-0 text-primary-light/70 size-3 lg:size-4"
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
              <span className="text-sm lg:text-base text-white/60 leading-relaxed lg:leading-relaxed">
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

  const currentNote = resolveSelectedNote(ALL_RELEASE_NOTES, selectedVersion);
  const activeVersion = currentNote?.version ?? CURRENT_APP_VERSION;
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
        <div className="flex flex-1 min-h-0">
          <VersionSidebar
            notes={ALL_RELEASE_NOTES}
            selectedVersion={activeVersion}
            locale={locale}
            onSelect={setSelectedVersion}
            label={t("versionsNavLabel")}
          />

          <div
            id="release-notes-description"
            className="flex-1 flex flex-col min-w-0 min-h-0"
          >
            {currentNote && (
              <ReleaseNoteContent
                note={currentNote}
                locale={locale}
                isLatest={isLatest}
                versionPicker={
                  <VersionSelect
                    notes={ALL_RELEASE_NOTES}
                    selectedVersion={activeVersion}
                    locale={locale}
                    onSelect={setSelectedVersion}
                    label={t("versionSelectAriaLabel")}
                  />
                }
                t={t}
              />
            )}
          </div>
        </div>

        <div className="px-5 py-3 lg:px-8 lg:py-4 shrink-0 flex justify-end border-t border-frame">
          <Button onClick={onClose} className="w-full sm:w-auto lg:px-6">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
