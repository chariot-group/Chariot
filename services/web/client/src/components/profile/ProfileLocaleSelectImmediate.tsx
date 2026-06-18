"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ProfileLocaleSelect from "@/components/profile/ProfileLocaleSelect";
import { useToast } from "@/hooks/useToast";
import {
  getLocaleFromPathname,
  replaceLocaleInPath,
  saveStoredLocale,
} from "@/hooks/useLocalePreference";
import { locales, type Locale } from "@/i18n/request";
import UserService from "@/services/UserService";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";

export default function ProfileLocaleSelectImmediate() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const t = useTranslations("ProfilePage.editProfile");
  const [isSaving, setIsSaving] = useState(false);

  const currentLocale = getLocaleFromPathname(pathname) ?? "fr";

  const handleLocaleChange = useCallback(
    async (newLocale: Locale) => {
      if (!locales.includes(newLocale) || newLocale === currentLocale) {
        return;
      }

      setIsSaving(true);
      try {
        const updatedUser = await UserService.updateCurrentUser({ preferredLocale: newLocale });
        dispatch(updateUser(updatedUser));
        saveStoredLocale(newLocale);
        router.push(replaceLocaleInPath(pathname, newLocale));
      } catch {
        toast.error(t("errorMessage"));
      } finally {
        setIsSaving(false);
      }
    },
    [currentLocale, dispatch, pathname, router, toast, t],
  );

  return (
    <ProfileLocaleSelect
      value={currentLocale}
      onValueChange={handleLocaleChange}
      disabled={isSaving}
    />
  );
}
