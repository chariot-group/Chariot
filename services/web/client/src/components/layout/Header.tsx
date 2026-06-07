"use client";

import Profile from "@/components/layout/Profile";
import SessionTimer from "@/components/layout/SessionTimer";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Logo from "@public/logo.svg";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { useAppSelector } from "@/store/hooks";
import {
  selectCurrentSession,
  selectCurrentUserParticipant,
  selectIsInSession,
} from "@/store/slices/sessionSlice";
import { useUser } from "@/hooks/useUser";
import NavigationService from "@/services/NavigationService";
import { buildPlayerSessionCharacterPath } from "@/lib/sessionInAppNavigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "fr";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const t = useTranslations("header");
  const isInSession = useAppSelector(selectIsInSession);
  const session = useAppSelector(selectCurrentSession);
  const user = useUser();
  const currentParticipant = useAppSelector((state) =>
    selectCurrentUserParticipant(state, user.user?.keycloakId || ""),
  );

  const logoAriaLabel = isInSession
    ? currentParticipant?.status === "gameMaster"
      ? t("logoAriaLabelInSessionGm")
      : t("logoAriaLabelInSessionPlayer")
    : t("logoAriaLabelHome");

  const handleLogoClick = async () => {
    try {
      if (isInSession && session) {
        if (currentParticipant?.status === "gameMaster") {
          const destination = await NavigationService.determineSpaceDestination(session.campaignId, locale);
          router.push(destination.path);
          return;
        }

        if (currentParticipant?.characterId) {
          router.push(
            buildPlayerSessionCharacterPath(locale, currentParticipant.characterId, session.code),
          );
          return;
        }
      }

      router.push(`/${locale}/welcome`);
    } catch (error) {
      console.error("Failed to determine logo destination:", error);
      router.push(`/${locale}/welcome`);
    }
  };

  return (
    <React.Fragment>
      {process.env.NEXT_PUBLIC_ENV_NAME === "integration" && (
        <div className="w-full shrink-0 bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm">
          ⚠️ ENVIRONNEMENT D&apos;INTEG v{appVersion}
        </div>
      )}
      <header className="w-full shrink-0 flex flex-row justify-between items-center px-2 sm:px-4 z-10">
        <SidebarTrigger className="self-start mt-1" />
        <button
          type="button"
          onClick={handleLogoClick}
          aria-label={logoAriaLabel}
          className="cursor-pointer bg-transparent border-none p-0">
          <Image
            src={Logo}
            alt="Chariot"
            width={70}
            height={70}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-22.5 md:h-22.5"
            priority
          />
        </button>
        <div className="relative flex items-center gap-3">
          <SessionTimer />
          <Profile />
        </div>
      </header>
    </React.Fragment>
  );
}
