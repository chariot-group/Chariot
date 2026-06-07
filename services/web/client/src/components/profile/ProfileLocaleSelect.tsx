"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveStoredLocale, replaceLocaleInPath } from "@/hooks/useLocalePreference";
import { locales, type Locale } from "@/i18n/request";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LOCALE_LABEL_KEYS: Record<Locale, "languages.fr" | "languages.en" | "languages.es"> = {
  fr: "languages.fr",
  en: "languages.en",
  es: "languages.es",
};

export default function ProfileLocaleSelect() {
  const t = useTranslations("ProfilePage");
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = (pathname.split("/")[1] || "fr") as Locale;

  const handleLocaleChange = (newLocale: string) => {
    const locale = newLocale as Locale;
    if (!locales.includes(locale) || locale === currentLocale) return;

    saveStoredLocale(locale);
    router.push(replaceLocaleInPath(pathname, locale));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
      <Label
        htmlFor="profile-locale-select"
        className="text-xs sm:text-sm text-muted-foreground shrink-0">
        {t("languagePreference")}
      </Label>
      <Select
        value={currentLocale}
        onValueChange={handleLocaleChange}>
        <SelectTrigger
          id="profile-locale-select"
          className="w-full sm:w-auto min-w-0"
          aria-label={t("languagePreferenceAria")}>
          <SelectValue>{t(LOCALE_LABEL_KEYS[currentLocale])}</SelectValue>
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
