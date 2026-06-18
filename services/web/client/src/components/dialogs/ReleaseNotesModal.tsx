"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function ReleaseNoteContent({ note, locale }: { note: ReleaseNote; locale: SupportedLocale }) {
  const translation = note.translations[locale];
  return (
    <ul className="flex flex-col gap-2.5" aria-label={translation.title}>
      {translation.highlights.map((highlight, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
          <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-white/30" aria-hidden="true" />
          <span>{highlight.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReleaseNotesModal({ open, onClose }: ReleaseNotesModalProps) {
  const t = useTranslations("releaseNotes");
  const pathname = usePathname();
  const rawLocale = pathname.split("/")[1] || "fr";
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : "fr";

  const [selectedVersion, setSelectedVersion] = useState<string>(CURRENT_APP_VERSION);

  const currentNote = ALL_RELEASE_NOTES.find((n) => n.version === selectedVersion) ?? ALL_RELEASE_NOTES[0];
  const currentTranslation = currentNote?.translations[locale];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent
        className="sm:max-w-lg max-h-[85dvh] flex flex-col gap-0 p-0 overflow-hidden"
        aria-describedby="release-notes-description"
      >
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-white/10">
          <DialogTitle className="text-base font-semibold leading-snug">
            {currentTranslation?.title}
            {currentNote && (
              <span className="ml-2 text-xs font-normal text-white/40">
                ({formatDate(currentNote.date)})
              </span>
            )}
          </DialogTitle>
          <div className="mt-3">
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger
                className="w-[160px] h-8 text-xs rounded-[13px]"
                aria-label={t("versionSelectAriaLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RELEASE_NOTES.map((note) => (
                  <SelectItem key={note.version} value={note.version} className="text-xs">
                    {t("versionLabel", { version: note.version })}
                    {note.version === CURRENT_APP_VERSION && (
                      <span className="ml-1.5 text-white/40">{t("latest")}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div
          id="release-notes-description"
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/20
            [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {currentNote && <ReleaseNoteContent note={currentNote} locale={locale} />}
        </div>

        <div className="px-6 py-4 shrink-0 flex justify-end border-t border-white/10">
          <Button onClick={onClose} className="rounded-[15px] text-sm">
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
