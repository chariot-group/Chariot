"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useKeycloak } from "@/providers/KeycloakProvider";
import LocaleSwitcher from "@/components/locale/LocaleSwitcher";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const { loading, login } = useKeycloak();

  if (loading) {
    return (
      <div className="w-full h-dvh flex items-center justify-center bg-background">
        <p>{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh gap-2 flex flex-col items-center justify-center bg-background">
      <Card className="w-[40%] shadow-md relative">
        <LocaleSwitcher className="absolute right-0 border-none shadow-none m-1 bg-card" />
        <div className="p-6 w-full flex flex-col items-center justify-center gap-[5dvh]">
          <h1 className="text-xl font-bold">{t("title")}</h1>

          <div className="w-[50%] flex flex-col gap-4">
            <Button
              onClick={login}
              className="w-full">
              {t("loginButton")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
