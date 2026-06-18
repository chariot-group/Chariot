"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locales, type Locale } from "@/i18n/request";
import { useTranslations } from "next-intl";

export const LOCALE_LABEL_KEYS: Record<Locale, "languages.fr" | "languages.en" | "languages.es"> = {
  fr: "languages.fr",
  en: "languages.en",
  es: "languages.es",
};

interface ProfileLocaleSelectProps {
  value: Locale;
  onValueChange: (locale: Locale) => void;
  disabled?: boolean;
}

export default function ProfileLocaleSelect({ value, onValueChange, disabled = false }: ProfileLocaleSelectProps) {
  const t = useTranslations("ProfilePage");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
      <Label
        htmlFor="profile-locale-select"
        className="text-sm font-medium shrink-0">
        {t("languagePreference")}
      </Label>
      <Select
        value={value}
        onValueChange={(newLocale) => onValueChange(newLocale as Locale)}
        disabled={disabled}>
        <SelectTrigger
          id="profile-locale-select"
          className="w-full sm:w-48 shrink-0"
          aria-label={t("languagePreferenceAria")}>
          <SelectValue>{t(LOCALE_LABEL_KEYS[value])}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
          {locales.map((locale) => (
            <SelectItem
              key={locale}
              value={locale}>
              {t(LOCALE_LABEL_KEYS[locale])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
