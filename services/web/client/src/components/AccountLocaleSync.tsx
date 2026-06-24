"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { replaceLocaleInPath, saveStoredLocale, shouldSyncAccountLocale } from "@/hooks/useLocalePreference";

/**
 * Applies the authenticated user's account locale when it differs from the URL prefix (FR-profile-language-preference).
 */
export default function AccountLocaleSync() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useUser({ autoFetch: true });
  const lastSyncedLocaleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || loading || !user?.preferredLocale) {
      return;
    }

    const accountLocale = user.preferredLocale;
    if (!shouldSyncAccountLocale(accountLocale, pathname)) {
      if (accountLocale) {
        lastSyncedLocaleRef.current = accountLocale;
      }
      return;
    }

    const syncKey = `${accountLocale}:${pathname}`;
    if (lastSyncedLocaleRef.current === syncKey) {
      return;
    }

    lastSyncedLocaleRef.current = syncKey;
    saveStoredLocale(accountLocale);
    router.replace(replaceLocaleInPath(pathname, accountLocale));
  }, [isAuthenticated, loading, user, pathname, router]);

  return null;
}
