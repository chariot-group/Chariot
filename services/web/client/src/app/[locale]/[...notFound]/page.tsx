"use client";

import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function NotFoundPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const { error } = useToast();
  const t = useTranslations("notFound");

  useEffect(() => {
    error(t("message"));
    // Prefer welcome over locale root — `/` re-triggers post-login and can loop (FR-post-auth-navigation).
    router.replace(`/${locale}/welcome`);
  }, [error, router, locale, t]);

  return null;
}
