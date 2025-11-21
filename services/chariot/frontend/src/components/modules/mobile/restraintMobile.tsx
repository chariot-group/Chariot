"use client";

import { useTranslations } from "next-intl";

export default function RestraintMobile() {
  const t = useTranslations("MobileRestraint");

  return (
    <div className="bg-background flex flex-col items-center justify-center w-full h-screen text-center p-4">
      <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
      <p>{t("subTitle")}</p>
    </div>
  );
}
