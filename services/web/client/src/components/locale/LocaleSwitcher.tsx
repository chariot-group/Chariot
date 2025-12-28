"use client";

import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";

interface LocaleSwitcherProps {
  className?: string;
}
export default function LanguageSwitcher({ className }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Récupérer la locale courante
  const currentLocale = useLocale();
  const t = useTranslations("LocaleSwitcher");

  const handleChange = (newLocale: string) => {
    const pathSegments = pathname.split("/");
    pathSegments[1] = newLocale; // Mise à jour de la locale dans l'URL
    const newPath = pathSegments.join("/");
    router.push(newPath);
  };

  return (
    <Select
      onValueChange={handleChange}
      value={currentLocale}>
      <SelectTrigger className={"bg-background text-foreground border-ring w-auto " + className}>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent className="bg-background text-foreground border-ring">
        {routing.locales.map((current) => (
          <SelectItem
            key={current}
            value={current}>
            {t("locale", { locale: current })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
