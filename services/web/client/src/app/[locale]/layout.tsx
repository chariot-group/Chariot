import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { KeycloakProvider } from "@/providers/KeycloakProvider";
import AuthenticatedShellGate from "@/components/layout/AuthenticatedShellGate";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/request";
import { preconnect } from "react-dom";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_ENV_NAME === "integration" ? "Chariot Integ" : "Chariot App",
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

/**
 * Opens the SSO and API connections while the app loads: login-required redirects to Keycloak,
 * and the first API calls follow the code exchange (FR-web-first-load-performance, req. 5 and 12).
 */
function preconnectToAuthAndApi() {
  for (const url of [process.env.NEXT_PUBLIC_KEYCLOAK_URL, process.env.NEXT_PUBLIC_API_URL]) {
    if (!url) continue;
    try {
      // No crossOrigin: navigation to Keycloak and credentialed API calls (axios withCredentials)
      // both use the credentialed connection pool.
      preconnect(new URL(url).origin);
    } catch {
      // Malformed URL: skip the hint, Keycloak init / API calls report the real error.
    }
  }
}

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
  preconnectToAuthAndApi();

  return (
    <html lang={locale}>
      <body className={`${interTight.variable} antialiased font-sans overflow-hidden h-dvh`}>
        <NextIntlClientProvider messages={messages}>
          <KeycloakProvider>
            {/* The shell (Redux, sidebar, header, session clients) loads once authenticated. */}
            <AuthenticatedShellGate>{children}</AuthenticatedShellGate>
          </KeycloakProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
