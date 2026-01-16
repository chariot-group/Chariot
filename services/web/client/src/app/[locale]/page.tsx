"use client";

import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function Home() {
  const { success, error, warning, info } = useToast();
  const t = useTranslations();

  useEffect(() => {
    success(t("toast.success"));
    error(t("toast.error"));
    warning(t("toast.warning"));
    info(t("toast.info"));
  }, [error, info, success, warning, t]);

  return (
    <div className="">
      <Card className="border-none">
        {t("home.greeting")} <span className="text-primary">{t("home.primary")}</span>
      </Card>
    </div>
  );
}
