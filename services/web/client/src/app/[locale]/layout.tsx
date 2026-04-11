import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { KeycloakProvider } from "@/providers/KeycloakProvider";
import ReduxProvider from "@/providers/ReduxProvider";
import ToastContainer from "@/components/ToastContainer";
import LocaleDetector from "@/components/LocaleDetector";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/request";
import PostLoginNavigator from "@/components/PostLoginNavigator";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chariot App",
  description: "A Dungeons & Dragons character management app.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${interTight.variable} antialiased bg-[url('/background.svg')] bg-cover bg-fixed bg-center bg-no-repeat font-sans overflow-hidden h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <KeycloakProvider>
            <ReduxProvider>
              <SidebarProvider>
                <AppSidebar />

                <div className="flex w-full flex-col h-screen overflow-hidden">
                  <PostLoginNavigator />
                  <LocaleDetector />
                  <ToastContainer />
                  <Header />

                  {children}
                </div>
              </SidebarProvider>
            </ReduxProvider>
          </KeycloakProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
