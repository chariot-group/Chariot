import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Locale } from "@/i18n/locales.generated";
import ToastContainer from "@/components/toast/ToastContainer";
import { KeycloakProvider } from "@/providers/KeycloakProvider";
import { setKeycloakTokenGetter } from "@/services/apiConfig";
import RestraintMobile from "@/components/modules/mobile/restraintMobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Chariot",
  description: "Tools for GMs and Players",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <KeycloakProvider>
        <ToastContainer />
        <div className="block lg:hidden">
          <RestraintMobile />
        </div>

        <div className="hidden lg:block">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
      </KeycloakProvider>
    </NextIntlClientProvider>
  );
}
